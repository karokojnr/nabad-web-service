const router = require('express').Router();
const Hotel = require('../models/Hotel');
const Product = require('../models/Product');
const User = require('../models/User');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

router.get('/hotels', (req, res) => {
  Hotel.find({}).then((h) => {
    res.json({ success: true, hotels: h });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

// Products list
router.get('/hotels/:id/products', (req, res) => {
  Product
    .find({ hotel: mongoose.Types.ObjectId(req.params.id) })
    .then((products) => {
    res.json({ success: true, products });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.get('/search', (req, res) => {
  let queryString = req.query;
  let name = queryString.name;
  // let hotel = queryString.hotel;
  name = name.toLowerCase();
  Hotel.find({ businessName: name }).then((h) => {
    res.json({ success: true, hotels: h });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.post('/register', (req, res) => {
  if (req.body === undefined) {
    throw new Error('A request body is required');
  }
  let hotel = new Hotel(req.body);
  bcrypt.hash(hotel.password, 10).then((hash) => {
    hotel.password = hash;
    return hotel.save();
  }).then((hotel) => {
    // TODO:: Send verification email ~ via a message broker
    res.json({ success: true, hotel: hotel });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.post('/login', (req, res) => {
  try {
    if (req.body.email === undefined || req.body.password === undefined) {
      throw new Error('Email and password are required');
    }
  } catch (e) {
    return res.status(404).json({ success: false, message: e.message });
  }
  let hotel;
  Hotel.findOne({ businessEmail: req.body.email }).then((h) => {
    hotel = h;
    if (hotel) return bcrypt.compare(req.body.password, hotel.password);
    else return User.findOne({ email: req.body.email });
  }).then((status) => {
    if (typeof status === 'boolean') {
      if (status) {
        let token = jwt.sign({
          email: hotel.businessEmail,
          id: hotel._id
        }, process.env.SESSIONKEY);
        return res.json({ success: true, token: { token, hotelId: hotel._id } });
      } else {
        throw new Error('Invalid email/password');
      }
    } else {
      let user = status;
      if (user === null) throw new Error('User doesn\'t exist');
      else return bcrypt.compare(req.body.password, user.password).then((isMatch) => {
        if (isMatch) {
          let token = jwt.sign({
            email: user.email,
            id: user._id
          }, process.env.SESSIONKEY);
          res.json({ success: true, token: { token , hotelId: hotel._id } });
        } else {
          throw new Error('Invalid email/password');
        }
      });
    }
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

module.exports = (app) => {
    app.use('/', router);
}
