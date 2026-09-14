const dotenv = require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const axios = require("axios");

const API_KEY = process.env.YELP_API_KEY;
async function getPlaces(location) {
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
        },
      }
    );

    return response.data.businesses;
  } 
catch (error) {
    return error;
  }
}

// getPlaces();

app.get('/fyp', async (req, res) => {
    // res.send('theres no way were getting this done in a week')
    res.send(await getPlaces(req.query.location));
})

app.get('/', (req, res) => {
    res.send('Gerald says hi!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});