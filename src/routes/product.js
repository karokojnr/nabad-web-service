const router = require('express').Router();
const Product = require('../models/Product');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const im = require('imagemagick');
const { ObjectId } = mongoose.Schema;

const storage = multer.diskStorage({
  destination: 'public/images/uploads/products',
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err)

      cb(null, raw.toString('hex') + path.extname(file.originalname))
    })
  }
});
const upload = multer({ storage: storage });

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

  let params = hotel.id ? { hotel: mongoose.Types.ObjectId(hotel.id) } : {};
  Product
    .find(params)
    // .populate('hotel', 'businessName')
    .sort({ createdAt: 'desc' })
    .then((h) => {
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

router.post('/add', upload.single('image'), (req, res) => {
    if (Object.keys(req.body).length === 0) {
        res.status(404).json({ success: false, message: 'A request body is required' });
    } else {
      let product = new Product(req.body);
      product.image = `${req.file.filename}`;
      product.save().then((product) => {
        im.resize({
          srcPath: `public/images/uploads/products/${req.file.filename}`,
          dstPath: `public/images/uploads/products/thumb_${req.file.filename}`,
          width: 300,
          height: 300
        }, function(error, stdin, stdout) {
          if (error)
            console.log(error);
          else
            console.log("Image resized successfully");
        });
        res.json({ success: true, product });
      }).catch((e) => {
        console.log(e.message);
        res.status(400).json({ success: false, message: e.message });
      });
    }
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

router.put('/edit/:id/image', upload.single('image'), (req, res) => {
  if (Object.keys(req.body).length === 0) {
      return res.status(404).json({ success: false, message: 'A request body is required' });
  }
  // TODO:: Delete existing profile
  Product.findOneAndUpdate( req.params.id, { name: req.body.name, price: req.body.price, image: req.file.filename }, { new: true } ).then((product) => {
    im.resize({
          srcPath: `public/images/uploads/products/${req.file.filename}`,
          dstPath: `public/images/uploads/products/thumb_${req.file.filename}`,
          width: 300,
          height: 300
        }, function(error, stdin, stdout) {
          if (error)
            console.log(error);
          else
            console.log("Image resized successfully");
        });
    res.json({ success: true, product });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.put('/edit/:id', (req, res) => {
  if (Object.keys(req.body).length === 0) {
      return res.status(404).json({ success: false, message: 'A request body is required' });
  }
  Product.findOneAndUpdate( req.params.id, { name: req.body.name, price: req.body.price }, { new: true } ).then((product) => {
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
