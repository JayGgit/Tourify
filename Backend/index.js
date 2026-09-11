const express = require('express');
const app = express();
const port = 3000;
const axios = require("axios");

// const API_KEY = process.env.YELP_API_KEY;
async function getRestaurants() {
  try {
    const response = await axios.get(
      "https://api.yelp.com/v3/businesses/search",
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
        },
        params: {
          term: "restaurants",
          location: "Los Angeles, CA",
          limit: 10,
        },
      }
    );

    console.log(response.data.businesses);
  } catch (error) {
    console.error(
      error.response?.data || error.message
    );
  }
}

// getRestaurants();

app.get('/fyp', (req, res) => {
    // res.send('theres no way were getting this done in a week')
    res.send(getRestaurants());
})

app.get('/', (req, res) => {
    res.send('Gerald says hi!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});