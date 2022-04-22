require('dotenv/config');

const { sequelize, getProducts, getRelated, getStyles, getSkus } = require('./db');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');

const app = express();

// middleware
app.use(express.json());
app.use(morgan('dev'));
app.use(helmet());


app.get('/', (req, res) => {
  res.send('hi');
});

app.get('/products:product_id', (req, res) => {
  getProducts(req.params.product_id.slice(1))
    .then((result) => {
      res.send(result);
    })
});

app.get('/products:product_id/styles', (req, res) => {
  getStyles(req.params.product_id.slice(1))
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log('Error getting styles', err);
    })
});

app.get('/products:product_id/related', (req, res) => {
  getRelated(req.params.product_id.slice(1))
    .then((result) => {
      res.send(result);
    })
});

app.listen(process.env.PORT, () => {
  console.log(`listening on port: ${process.env.PORT}`);
});
