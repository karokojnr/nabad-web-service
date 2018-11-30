const router = require('express').Router();
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

// Products list
router.get('/', (req, res) => {
  // Pull hotel token and use it to filter hotels
  let hotel = {}

  if (req.headers['x-token'] || req.query['token']) {
    let token = "";
    if (req.headers['x-token'] !== undefined) token = req.headers['x-token'];
    if (req.query['token'] !== undefined) token = req.query['token'];
    jwt.verify(token, process.env.SESSIONKEY, function(error, decode) {
      if (error) {
        throw new Error(error.message);
      } else {
        hotel = decode;
      }
    });
  }

  let params = hotel.id ? { hotel: hotel.id } : {};
  Product.find(params).then((h) => {
    res.json({ success: true, products: h });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

// Get specific item
router.get('/:id', (req, res) => {
  Product.findById(req.params.id).then((product) => {
    res.json({ success: true, product });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.post('/add', (req, res) => {
    if (Object.keys(req.body).length === 0) {
        res.status(404).json({ success: false, message: 'A request body is required' });
    }
    let product = new Product(req.body);
    product.save().then((product) => {
      res.json({ success: true, product });
    }).catch((e) => {
      res.status(404).json({ success: false, message: e.message });
    });
});

router.put('/activate/:id', (req, res) => {
  Product.findById(req.params.id).then((product) => {
    // Negate the current status
    product.sellingStatus = !product.sellingStatus;
    return product.save();
  }).then((product) => {
    res.json({ success: true, product });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.put('/edit/:id', (req, res) => {
  if (Object.keys(req.body).length === 0) {
      res.status(404).json({ success: false, message: 'A request body is required' });
  }
  Product.findByIdAndUpdate(req.params.id, req.body, { new: true }).then((product) => {
    res.json({ success: true, product });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.delete('/delete/:id', (req, res) => {
  Product.findByIdAndDelete(req.params.id).then((product) => {
    // Return null product
    res.json({ success: true, product });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

module.exports = (app) => {
    app.use('/products', router);
}
