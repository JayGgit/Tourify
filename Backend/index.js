const dotenv = require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('node:crypto');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;
const API_KEY = process.env.YELP_API_KEY;

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = new Set([
    'http://localhost:8081',
    'http://127.0.0.1:8081',
  ]);

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

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

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validateCredentials(email, password) {
  return (
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    && typeof password === 'string'
    && password.length >= 8
  );
}

app.post('/register', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!validateCredentials(email, password)) {
    return res.status(400).json({ error: 'Enter a valid email and a password of at least 8 characters.' });
  }

  try {
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = await derivePasswordHash(password, salt);
    const existing = await accounts.findOne({ email });

    if (existing?.passwordHash) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    if (existing) {
      await accounts.updateOne(
        { _id: existing._id },
        {
          $set: {
            salt,
            passwordHash: passwordHash.toString('hex'),
            updatedAt: new Date(),
          },
        }
      );
    } else {
      await accounts.insertOne({
        email,
        salt,
        passwordHash: passwordHash.toString('hex'),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return res.status(201).json({ email });
  } catch (error) {
    console.error('Failed to register account:', error.message);
    return res.status(500).json({ error: 'Unable to create the account.' });
  }
});

app.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = req.body?.password;

  if (!validateCredentials(email, password)) {
    return res.status(400).json({ error: 'Enter a valid email and a password of at least 8 characters.' });
  }

  try {
    const account = await accounts.findOne({ email });
    if (!account?.salt || !account.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordHash = await derivePasswordHash(password, account.salt);
    const matches = crypto.timingSafeEqual(
      passwordHash,
      Buffer.from(account.passwordHash, 'hex')
    );
    if (!matches) return res.status(401).json({ error: 'Invalid email or password.' });

    await accounts.updateOne({ _id: account._id }, { $set: { updatedAt: new Date() } });
    return res.json({ email });
  } catch (error) {
    console.error('Failed to log in:', error.message);
    return res.status(500).json({ error: 'Unable to log in.' });
  }
});

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
  return (hours || []).map((entry) => {
    const start = entry.start?.padStart(4, '0');
    const end = entry.end?.padStart(4, '0');
    return `${entry.day}: ${start || '?'}-${end || '?'}`;
  }).join(', ');
}

async function getPlaces(location, term, offset, limit = 10) {
  const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
    headers: yelpHeaders(),
    params: {
      location,
      term,
      limit,
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

app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ error: 'Google ID token is required' });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    console.error('Google authentication is unavailable: GOOGLE_CLIENT_ID is missing');
    return res.status(503).json({ error: 'Google authentication is not configured' });
  }

  if (!accounts) {
    return res.status(503).json({ error: 'Account storage is not ready' });
  }

  try {
    const tokenResponse = await axios.get(
      'https://oauth2.googleapis.com/tokeninfo',
      { params: { id_token: idToken } }
    );
    const claims = tokenResponse.data;

    if (
      claims.aud !== process.env.GOOGLE_CLIENT_ID
      || claims.email_verified !== 'true'
      || !claims.sub
      || !claims.email
    ) {
      return res.status(401).json({ error: 'Invalid Google account token' });
    }

    await accounts.updateOne(
      { googleId: claims.sub },
      {
        $set: {
          googleId: claims.sub,
          email: claims.email.toLowerCase(),
          name: claims.name || '',
          picture: claims.picture || '',
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return res.json({
      email: claims.email.toLowerCase(),
      name: claims.name || '',
      picture: claims.picture || '',
    });
  } catch (error) {
    const status = error.response?.status;
    if (status) {
      console.error(`Google token verification failed with status ${status}`);
    } else {
      console.error('Google authentication failed:', error.message);
    }
    return res.status(401).json({ error: 'Google authentication failed' });
  }
});

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

  return {
    ...business,
    images: business.photos || [],
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

  const page = req.query.page == null ? 0 : Number(req.query.page);
  if (!Number.isInteger(page) || page < 0 || page > 120) {
    return res.status(400).json({ error: 'page must be an integer between 0 and 120' });
  }

  try {
    const categories = [
      'restaurants',
      'parks',
      'tourist attractions',
      'landmarks and historical sites',
      'museums',
      'shopping',
      'nightlife',
      'beaches',
    ];
    const interests = typeof req.query.interests === 'string'
      ? req.query.interests
        .split(',')
        .map((interest) => interest.trim().slice(0, 60))
        .filter(Boolean)
        .slice(0, 8)
      : [];
    const personalizedQuery = typeof req.query.query === 'string'
      ? req.query.query.trim().slice(0, 200)
      : '';
    const terms = [...categories, ...interests, personalizedQuery]
      .filter(Boolean)
      .map((term) => term.toLowerCase());
    const termCounts = terms.reduce((counts, term) => {
      counts.set(term, (counts.get(term) || 0) + 1);
      return counts;
    }, new Map());
    const termLanes = new Map();
    const resultsByCategory = await Promise.all(
      terms.map((term) => {
        const lane = termLanes.get(term) || 0;
        termLanes.set(term, lane + 1);
        const offset = page * termCounts.get(term) + lane;
        return getPlaces(req.query.location, term, offset, 1);
      })
    );
    const places = [];
    const seenIds = new Set();

    for (const categoryResults of resultsByCategory) {
      const place = categoryResults[0];
      if (place && !seenIds.has(place.id)) {
        seenIds.add(place.id);
        places.push(place);
      }
    }

    res.json(places);
  } catch (error) {
    console.error('Failed to fetch recommended places:', error.message);
    res.status(502).json({ error: 'Failed to fetch recommended places' });
  }
});

app.get('/search', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  if (!req.query.location || !search) {
    return res.status(400).send('Missing location or search query parameters');
  }

  try {
    res.json(await getPlaces(req.query.location, search, req.query.offset));
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
