const dotenv = require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('node:crypto');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;
const API_KEY = process.env.YELP_API_KEY;
const HASDATA_API_KEY = process.env.HASDATA_API_KEY;

app.use(express.json({ limit: '10kb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

let accounts;

function derivePasswordHash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, hash) => {
      if (error) reject(error);
      else resolve(hash);
    });
  });
}

function getOffset(value) {
  const offset = Number.parseInt(value, 10);
  return Number.isInteger(offset) && offset >= 0 ? offset : Math.floor(Math.random() * 230);
}

function mapBusiness(business) {
  return {
    id: business.id,
    name: business.name,
    category: business.categories?.[0]?.title ?? 'Unknown',
    img: business.image_url,
    stars: business.rating,
    reviewAmt: business.review_count,
    lat: business.coordinates?.latitude,
    long: business.coordinates?.longitude,
    description: business.location?.display_address?.join(', ') ?? '',
    term: business.categories?.map((category) => category.title).join(', ') ?? '',
    address: business.location?.address1,
    city: business.location?.city,
    state: business.location?.state,
    zip_code: business.location?.zip_code,
    phone: business.phone,
    businessId: business.id,
    url: business.url,
  };
}

function yelpHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
  };
}

function formatHours(hours) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formatTime = (value) => {
    if (!value) return '?';
    const numericValue = Number(value);
    const hour = Math.floor(numericValue / 100);
    const minute = numericValue % 100;
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
  };

  return (hours || []).map((entry) => {
    return `${days[entry.day] || 'Day'} ${formatTime(entry.start)} - ${formatTime(entry.end)}`;
  }).join(', ');
}

async function getPlaces(location, term, offset) {
  const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
    headers: yelpHeaders(),
    params: {
      location,
      term,
      limit: 10,
      offset: getOffset(offset),
    },
  });

  return response.data.businesses.map(mapBusiness);
}

async function getBusinessURL(businessId) {
  const response = await axios.get(
    `https://api.yelp.com/v3/businesses/${encodeURIComponent(businessId)}`,
    {
      headers: yelpHeaders(),
    }
  );

  return response.data.url;
}

async function getHasDataYelpPhotos(businessId) {
  if (!HASDATA_API_KEY) {
    const error = new Error('HASDATA_API_KEY is not configured.');
    error.code = 'HASDATA_NOT_CONFIGURED';
    throw error;
  }

  let response;
  try {
    response = await axios.get('https://api.hasdata.com/scrape/yelp/place', {
      params: {
        placeId: businessId,
      },
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': HASDATA_API_KEY,
      },
      timeout: 30000,
    });
  } catch (error) {
    const providerMessage = typeof error.response?.data === 'string'
      ? error.response.data
      : error.response?.data?.message || error.response?.data?.error;
    console.error('HasData Yelp request failed:', providerMessage || error.message);
    throw error;
  }

  const urls = response.data?.placeResult?.images;
  if (!Array.isArray(urls)) {
    throw new Error('HasData returned no Yelp place images.');
  }

  return [...new Set(urls)]
    .filter((url) => typeof url === 'string' && /^https:\/\/s3-media\d+\.fl\.yelpcdn\.com\/bphoto\/.+\/l\.jpg$/i.test(url))
}

async function getBusinessDetails(businessId) {
  const response = await axios.get(
    `https://api.yelp.com/v3/businesses/${encodeURIComponent(businessId)}`,
    {
      headers: yelpHeaders(),
      params: { locale: 'en_US' },
    }
  );
  const business = response.data;
  const attributes = business.attributes || {};
  const images = await getHasDataYelpPhotos(businessId);

  return {
    ...business,
    images,
    address: business.location?.display_address?.join(', ') || '',
    phone: business.display_phone || business.phone || '',
    reviews: business.review_count ? `${business.review_count.toLocaleString()} reviews` : 'No reviews yet',
    reviewsUrl: business.url || '',
    website: attributes.business_url || attributes.BusinessUrl || attributes.BusinessDisplayUrl || '',
    full_menu: business.yelp_menu_url || attributes.menu_url || attributes.MenuUrl || '',
    highlights: [],
    operation_hours: {
      hours: [{ hours: formatHours(business.hours?.[0]?.open) }],
    },
  };
}

app.get('/fyp', async (req, res) => {
  if (!req.query.location) {
    return res.status(400).send('Missing location parameter');
  }

  try {
    const term = req.query.query || req.query.term;
    res.json(await getPlaces(req.query.location, term, req.query.offset));
  } catch (error) {
    console.error('Failed to fetch recommended places:', error.message);
    res.status(502).json({ error: 'Failed to fetch recommended places' });
  }
});

app.get('/search', async (req, res) => {
  if (!req.query.location || !req.query.search) {
    return res.status(400).send('Missing location or search query parameters');
  }

  try {
    res.json(await getPlaces(req.query.location, req.query.search, req.query.offset));
  } catch (error) {
    console.error('Failed to search places:', error.message);
    res.status(502).json({ error: 'Failed to search places' });
  }
});

app.get('/fypURL', async (req, res) => {
  if (!req.query.businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    res.send(await getBusinessURL(req.query.businessId));
  } catch (error) {
    console.error('Failed to fetch business URL:', error.message);
    res.status(502).json({ error: 'Failed to fetch business URL' });
  }
});

app.get('/account/register', async (req, res) => {
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  const password = req.query.password;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Provide a valid email and a password with at least 8 characters.' });
  }

  try {
    const salt = crypto.randomBytes(16);
    const passwordHash = await derivePasswordHash(password, salt);
    const result = await accounts.insertOne({
      email,
      passwordSalt: salt.toString('hex'),
      passwordHash: passwordHash.toString('hex'),
      createdAt: new Date(),
    });

    res.status(201).json({ id: result.insertedId.toString(), email });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }
    console.error('Account registration failed:', error.message);
    res.status(500).json({ error: 'Unable to create account.' });
  }
});

app.get('/account/login', async (req, res) => {
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
  const password = req.query.password;

  if (!email || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const account = await accounts.findOne({ email });
    if (!account) return res.status(401).json({ error: 'Invalid email or password.' });

    const salt = Buffer.from(account.passwordSalt, 'hex');
    const storedHash = Buffer.from(account.passwordHash, 'hex');
    const suppliedHash = await derivePasswordHash(password, salt);
    if (!crypto.timingSafeEqual(storedHash, suppliedHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.json({ id: account._id.toString(), email: account.email });
  } catch (error) {
    console.error('Account login failed:', error.message);
    res.status(500).json({ error: 'Unable to log in.' });
  }
});

app.get('/businesses/:businessId', async (req, res) => {
  if (!req.params.businessId) {
    return res.status(400).json({ error: 'businessId is required' });
  }

  try {
    res.json(await getBusinessDetails(req.params.businessId));
  } catch (error) {
    const status = error.response?.status;
    console.error('Failed to fetch business details:', error.message);
    if (error.code === 'HASDATA_NOT_CONFIGURED') {
      return res.status(500).json({ error: 'Photo service is not configured.' });
    }
    res.status(status === 404 ? 404 : 502).json({ error: 'Failed to fetch business details' });
  }
});

app.get('/', (req, res) => {
  res.send('Gerald says hi!');
});

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required. Set it in Backend/.env.');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const database = client.db(process.env.MONGODB_DB || 'tourify');
  accounts = database.collection('accounts');
  await accounts.createIndex({ email: 1 }, { unique: true });

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend:', error.message);
  process.exitCode = 1;
});
