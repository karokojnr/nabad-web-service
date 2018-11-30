const router = require('express').Router();
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');

// Products list
router.get('/', (req, res) => {
  // Pull hotel token and use it to filter hotels
  if(req.headers['access-token'] || req.query['token']){
    let token = req.headers['access-token'];
    // req.query['token']
    let decode = jwt.decode()
  }
  Product.find({}).then((h) => {
    res.json({ success: true, products: h });
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


module.exports = (app) => {
    app.use('/products', router);
}
