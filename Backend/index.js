const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const axios = require("axios");

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

async function getBusinessDetails(businessId) {
  try {
    const response = await axios.get(
      "https://api.yelp.com/v3/businesses/${businessId}",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        params: {
          businessId: businessId,
        },
      }
    );
    return response.data.businesses.map((business) => ({
      description: business.description,
    }));
  } catch (error) {
    return error;
  }
}

app.get('/fyp', async (req, res) => {
  try {
    res.json(await getPlaces(req.query.location, req.query.term));
  } catch (error) {
    console.error('Failed to fetch recommended places:', error.message);
    res.status(502).json({ error: 'Failed to fetch recommended places' });
  }
})

app.get('/fypDetails', async (req, res) => {
    res.send(await getBusinessDetails(req.query.businessId));
})
app.get('/', (req, res) => {
  res.send('Gerald says hi!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});