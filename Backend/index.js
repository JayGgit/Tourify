const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    console.log(req)
    res.send('Gerald says hi!');
});

app.get('/fyp', (req, res) => {
    res.send('theres no way were getting this done in a week')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});