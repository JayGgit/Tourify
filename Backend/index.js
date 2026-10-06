const dotenv = require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('node:crypto');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;
const API_KEY = process.env.YELP_API_KEY;

app.use(express.json({ limit: '10kb' }));

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

async function getPlaces(location, term, offset, limit = 10) {
  const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
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
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    }
  );

  return response.data.url;
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
