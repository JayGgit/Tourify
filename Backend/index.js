const dotenv = require('dotenv').config();
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;
const axios = require("axios");

const API_KEY = process.env.YELP_API_KEY;
const USERS_FILE = path.join(__dirname, 'users.json');
const REMOTE_PLACES_API_URL =
  process.env.REMOTE_PLACES_API_URL || 'http://34.201.233.58:3000/fyp';

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const isLocalWebOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(
    origin || ''
  );

  if (isLocalWebOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
});

// Google OAuth2 client for token verification
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleIdToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}
async function getPlaces(location) {
  let offset = parseInt(Math.random() * 230);

  console.log(offset)

  try {
    const response = await axios.get(
      "https://api.yelp.com/v3/businesses/search",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        params: {
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
    const response = await axios.get(REMOTE_PLACES_API_URL, {
      params: req.query,
      timeout: 15000,
    });
    res.json(response.data);
  } catch (error) {
    console.error('Failed to fetch remote recommendations:', error.message);
    res.status(502).json({ error: 'Failed to fetch recommended places' });
  }
})

app.get('/search', async (req, res) => {
  if (!req.query.location || !req.query.search) {
    return res.status(400).send("Missing location or search query parameters");
  }
  if (!API_KEY || API_KEY === 'your_yelp_api_key_here') {
    return res.status(503).json({
      error: 'Search is not configured. Add a valid YELP_API_KEY to Backend/.env.',
    });
  }
  try {
    res.json(await searchPlaces(req.query.location, req.query.search));
  } catch (error) {
    console.error('Failed to fetch recommended places:', error.message);
    res.status(502).json({ error: 'Failed to fetch recommended places' });
  }
})

app.get('/account/:id', async (req, res) => {
  let id = req.params.id;
  
})

app.use(express.json());

app.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Missing ID token' });
    }

    const payload = await verifyGoogleIdToken(idToken);
    if (!payload.email || payload.email_verified !== true) {
      return res.status(401).json({ error: 'Google account email is not verified.' });
    }

    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }

    const user = {
      googleUserId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || '',
      givenName: payload.given_name || '',
      familyName: payload.family_name || '',
      photo: payload.picture || '',
      updatedAt: new Date().toISOString(),
    };
    const existingIndex = users.findIndex(
      (storedUser) => storedUser.googleUserId === user.googleUserId
    );
    const isNewUser = existingIndex === -1;

    if (isNewUser) {
      users.push({ ...user, createdAt: user.updatedAt });
    } else {
      users[existingIndex] = { ...users[existingIndex], ...user };
    }
    fs.writeFileSync(USERS_FILE, `${JSON.stringify(users, null, 2)}\n`);

    res.json({ ...user, isNewUser });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Invalid Google ID token' });
  }
});

app.get('/', (req, res) => {
  res.send('Gerald says hi!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
