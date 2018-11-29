const router = require('express').Router();
const Hotel = require('../models/Hotel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.get('/hotels', (req, res) => {
  Hotel.find({}).then((h) => {
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
      throw new Error('A email & password are required');
    }
  } catch (e) {
    return res.status(404).json({ success: false, message: e.message });
  }
  let hotel;
  Hotel.findOne({ businessEmail: req.body.email }).then((h) => {
    hotel = h;
    if (hotel) return bcrypt.compare(req.body.password, hotel.password);
    else throw new Error('Business email doesn\'t exist');
  }).then((status) => {
    if (status) {
      let token = jwt.sign({
        email: hotel.businessEmail,
        id: hotel._id
      }, process.env.SESSIONKEY);
      res.json({ success: true, token });
    } else {
      throw new Error('Invalid email/password');
    }
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

module.exports = (app) => {
    app.use('/', router);
}
