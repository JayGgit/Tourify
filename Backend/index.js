const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const axios = require("axios");

const API_KEY = process.env.YELP_API_KEY;
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

// getPlaces();

app.get('/fyp', async (req, res) => {
  try {
    res.json(await getPlaces(req.query.location));
  } catch (error) {
    console.error('Failed to fetch recommended places:', error.message);
    res.status(502).json({ error: 'Failed to fetch recommended places' });
  }
})

app.get('/', (req, res) => {
  res.send('Gerald says hi!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});