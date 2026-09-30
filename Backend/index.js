const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const axios = require("axios");
const crypto = require('node:crypto');
const { MongoClient } = require('mongodb');

app.use(express.json({ limit: '10kb' }));

let accounts;
const API_KEY = process.env.YELP_API_KEY;
async function getPlaces(location) {
  let offset = parseInt(Math.random() * 230);

function derivePasswordHash(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, hash) => {
      if (error) reject(error);
      else resolve(hash);
    });
  });
}

const API_KEY = process.env.YELP_API_KEY;
async function getPlaces(location, term) {
  try {
    const response = await axios.get(
      "https://api.yelp.com/v3/businesses/search",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        params: {
          location: location,
          term: term,
          limit: 10,
          offset: offset,
        },
      }
    );

    return response.data.businesses.map((business) => ({
      id: business.id,
      name: business.name,
      category: business.categories?.[0]?.title ?? "Unknown",
      img: business.image_url,
      stars: business.rating,
      reviewAmt: business.review_count,
      lat: business.coordinates?.latitude,
      long: business.coordinates?.longitude,
      description: business.location?.display_address?.join(", ") ?? "",
      term: business.categories.map((category) => category.title).join(", "),
      address: business.location.address1,
      city: business.location.city,
      state: business.location.state,
      zip_code: business.location.zip_code,
      phone: business.phone,
      businessId: business.id,
      url: business.url,
    }));
  }
  catch (error) {
    throw error;
  }
}

async function getBusinessURL(businessId) {
  try {
    const response = await axios.get(
      `https://api.yelp.com/v3/businesses/${encodeURIComponent(businessId)}`,
async function searchPlaces(location, search) {
  let offset = parseInt(Math.random() * 230);

  console.log(offset)

  try {
    const response = await axios.get(
      "https://api.yelp.com/v3/businesses/search",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
      }
    );
    return response.data.url;
  } catch (error) {
        params: {
          term: search,
          location: location,
          limit: 10,
          offset: offset,
        },
      }
    );

    return response.data.businesses.map((business) => ({
      id: business.id,
      name: business.name,
      category: business.categories?.[0]?.title ?? "Unknown",
      img: business.image_url,
      stars: business.rating,
      reviewAmt: business.review_count,
      lat: business.coordinates?.latitude,
      long: business.coordinates?.longitude,
      description: business.location?.display_address?.join(", ") ?? "",
    }));
  }
  catch (error) {
    throw error;
  }
}

app.get('/fyp', async (req, res) => {
  if (!req.query.location) {
    return res.status(400).send("Missing location parameter");
  }
  try {
    res.json(await getPlaces(req.query.location));
  } catch (error) {
    console.error('Failed to fetch recommended places:', error.message);
    res.status(502).json({ error: 'Failed to fetch recommended places' });
  }
})

app.get('/search', async (req, res) => {
  if (!req.query.location || !req.query.search) {
    return res.status(400).send("Missing location or search query parameters");
  }
  try {
    res.json(await searchPlaces(req.query.location, req.query.search));
  } catch (error) {
    console.error('Failed to fetch recommended places:', error.message);
    res.status(502).json({ error: 'Failed to fetch recommended places' });
  }
})

app.get('/fypURL', async (req, res) => {
    res.send(await getBusinessURL(req.query.businessId));
    // if (!req.query.businessId) {
    //   return res.status(400).json({ error: 'businessId is required' });
    // }

    // try {
    //   res.json(await getBusinessURL(req.query.businessId));
    // } catch (error) {
    //   console.error('Failed to fetch business URL:', error.response?.data ?? error.message);
    //   res.status(error.response?.status ?? 500).json({
    //     error: error.response?.data ?? 'Failed to fetch business URL',
    //   });
    // }
})
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