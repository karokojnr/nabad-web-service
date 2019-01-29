const router = require('express').Router();
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let token = {};

function getToken(req, res, next) {
  if (req.headers['x-token'] || req.query['token']) {
    let tok = "";
    if (req.headers['x-token'] !== undefined) tok = req.headers['x-token'];
    if (req.query['token'] !== undefined) tok = req.query['token'];
    jwt.verify(tok, process.env.SESSIONKEY, function(error, decode) {
      if (error) {
        return res.status(403).json({ success: false, message: "We cannot very your profile" + error.message });
      } else {
        token = decode;
      }
    });
  }

  if (token.id === undefined) {
    return res.status(403).json({ success: false, message: "You are not authorized" });
  }
  next();
}

router.get('/admin/users/', getToken, (req, res) => {
  User.find({ hotel: token.id }).then((users) => {
    res.json({ success: true, users });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

// Get specific user
router.get('/admin/users/:id', getToken, (req, res) => {
  User.findById(req.params.id).then((user) => {
    res.json({ success: true, user });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.post('/admin/users/add', getToken, (req, res) => {
    if (Object.keys(req.body).length === 0) {
        res.status(404).json({ success: false, message: 'A request body is required' });
    }
    let user = new User(req.body);
    bcrypt.hash(user.password, 10).then((hash) => {
      user.password = hash;
      user.hotel = token.id;
      return user.save();
    }).then((user) => {
      res.json({ success: true, user });
    }).catch((e) => {
      res.status(404).json({ success: false, message: e.message });
    });
});

router.put('/admin/users/activate/:id', getToken, (req, res) => {
  User.findById(req.params.id).then((user) => {
    // Negate the current status
    user.isActive = !user.isActive;
    return user.save();
  }).then((user) => {
    res.json({ success: true, user });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.put('/admin/users/edit/:id', getToken, (req, res) => {
  if (Object.keys(req.body).length === 0) {
      res.status(404).json({ success: false, message: 'A request body is required' });
  }
  User.findByIdAndUpdate(req.params.id, req.body, { new: true }).then((user) => {
    res.json({ success: true, user });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.delete('/admin/users/delete/:id', getToken, (req, res) => {
  User.findByIdAndDelete(req.params.id).then((user) => {
    // Return null user
    res.json({ success: true, user });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

router.put('/hotel/token', getToken, (req, res) => {
  if (Object.keys(req.body).length === 0) {
      res.status(404).json({ success: false, message: 'A request body is required' });
  }
  Hotel.findOneAndUpdate( { _id: token.id }, { FCMToken: req.body.token }, { new: true }).then((hotel) => {
    res.json({ 
      success: true,
      token: hotel.token,
      hotelId: hotel._id
    });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

module.exports = (app) => {
  app.use('/', router);
}
