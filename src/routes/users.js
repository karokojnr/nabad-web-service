const router = require('express')
  .Router();
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Customer = require('../models/Customer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const im = require('imagemagick');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

let token = {};
const storage = multer.diskStorage({
  destination: 'public/images/uploads/customers',
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err);

      cb(null, raw.toString('hex') + path.extname(file.originalname));
    });
  }
});
const upload = multer({ storage: storage });

function getToken(req, res, next) {
  if (req.headers['x-token'] || req.query['token']) {
    let tok = '';
    if (req.headers['x-token'] !== undefined) tok = req.headers['x-token'];
    if (req.query['token'] !== undefined) tok = req.query['token'];
    jwt.verify(tok, process.env.SESSIONKEY, function (error, decode) {
      if (error) {
        return res.status(403)
          .json({
            success: false,
            message: 'We cannot very your profile' + error.message
          });
      } else {
        token = decode;
      }
    });
  }

  if (token.id === undefined) {
    return res.status(403)
      .json({
        success: false,
        message: 'You are not authorized'
      });
  }
  next();
}

router.get('/admin/users/', getToken, (req, res) => {
  User.find({ hotel: token.id })
    .then((users) => {
      res.json({
        success: true,
        users
      });
    })
    .catch((e) => {
      res.status(404)
        .json({
          success: false,
          message: e.message
        });
    });
});

// Get specific user
router.get('/admin/users/:id', getToken, (req, res) => {
  User.findById(req.params.id)
    .then((user) => {
      res.json({
        success: true,
        user
      });
    })
    .catch((e) => {
      res.status(404)
        .json({
          success: false,
          message: e.message
        });
    });
});

router.post('/admin/users/add', getToken, (req, res) => {
  if (Object.keys(req.body).length === 0) {
    res.status(404)
      .json({
        success: false,
        message: 'A request body is required'
      });
  }
  let user = new User(req.body);
  bcrypt.hash(user.password, 10)
    .then((hash) => {
      user.password = hash;
      user.hotel = token.id;
      return user.save();
    })
    .then((user) => {
      res.json({
        success: true,
        user
      });
    })
    .catch((e) => {
      res.status(404)
        .json({
          success: false,
          message: e.message
        });
    });
});

router.put('/admin/users/activate/:id', getToken, (req, res) => {
  User.findById(req.params.id)
    .then((user) => {
      // Negate the current status
      user.isActive = !user.isActive;
      return user.save();
    })
    .then((user) => {
      res.json({
        success: true,
        user
      });
    })
    .catch((e) => {
      res.status(404)
        .json({
          success: false,
          message: e.message
        });
    });
});

router.put('/admin/users/edit/:id', getToken, (req, res) => {
  if (Object.keys(req.body).length === 0) {
    res.status(404)
      .json({
        success: false,
        message: 'A request body is required'
      });
  }
  User.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .then((user) => {
      res.json({
        success: true,
        user
      });
    })
    .catch((e) => {
      res.status(404)
        .json({
          success: false,
          message: e.message
        });
    });
});

router.delete('/admin/users/delete/:id', getToken, (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      // Return null user
      res.json({
        success: true,
        user
      });
    })
    .catch((e) => {
      res.status(404)
        .json({
          success: false,
          message: e.message
        });
    });
});

router.put('/hotel/token', getToken, (req, res) => {
  if (Object.keys(req.body).length === 0) {
    res.status(404)
      .json({
        success: false,
        message: 'A request body is required'
      });
  }
  Hotel.findOneAndUpdate({ _id: token.id }, { FCMToken: req.body.token }, { new: true })
    .then((hotel) => {
      res.json({
        success: true,
        token: hotel.token,
        hotelId: hotel._id
      });
    })
    .catch((e) => {
      res.status(404)
        .json({
          success: false,
          message: e.message
        });
    });
});

router.put('/customer/token', getToken, (req, res) => {
  if (Object.keys(req.body).length === 0) {
    res.status(404)
      .json({
        success: false,
        message: 'A request body is required'
      });
  }
  Customer.findOneAndUpdate({ _id: token.id }, { FCMToken: req.body.token }, { new: true })
    .then((customer) => {
      res.json({
        success: true,
        token: customer.FCMToken,
        userId: customer._id
      });
    })
    .catch((e) => {
      res.status(404)
        .json({
          success: false,
          message: e.message
        });
    });
});

router.post('/customer/login', (req, res) => {
  try {
    if (req.body.email === undefined || req.body.password === undefined) {
      throw new Error('Email and password are required');
    }
  } catch (e) {
    return res.json({
      success: false,
      message: e.message
    });
  }
  let customer;
  Customer.findOne({ email: req.body.email })
    .then((cust) => {
      customer = cust;
      if (customer) {
        return bcrypt.compare(req.body.password, customer.password);
      } else {
        return res.json({
          success: false,
          message: 'User doesn\'t exist'
        });
      }
    })
    .then((status) => {
      if (typeof status === 'boolean') {
        if (status) {
          let token = jwt.sign({
            email: customer.emai,
            id: customer._id
          }, process.env.SESSIONKEY);
          customer.mobileNumber = `+254${customer.mobileNumber}`;
          return res.json({
            success: true,
            token,
            customer
          });
        } else {
          throw new Error('Invalid email/password');
        }
      }
    })
    .catch((e) => {
      res.json({
        success: false,
        message: e.message
      });
    });
});

router.post('/customer/register', upload.single('profile'), (req, res) => {
  if (req.body === undefined) {
    throw new Error('A request body is required');
  }
  let customer = new Customer(req.body);
  customer.mobileNumber = parseInt(customer.mobileNumber);
  customer.profile = `${req.file.filename}`;
  bcrypt.hash(customer.password, 10)
    .then((hash) => {
      customer.password = hash;
      return customer.save();
    })
    .then((customer) => {
      // TODO:: Send verification email ~ via a message broker
      im.resize({
        srcPath: `public/images/uploads/customers/${req.file.filename}`,
        dstPath: `public/images/uploads/customers/thumb_${req.file.filename}`,
        width: 300,
        height: 300
      }, function (error, stdin, stdout) {
        if (error) {
          console.log(error);
        } else {
          console.log('Image resized successfully');
        }
      });
      let token = jwt.sign({
        email: customer.email,
        id: customer._id
      }, process.env.SESSIONKEY);
      customer.mobileNumber = `+254${customer.mobileNumber}`;
      res.json({
        success: true,
        customer,
        token
      });
    })
    .catch((e) => {
      console.log(e);
      res.json({
        success: false,
        message: e.message
      });
    });
});

router.put('/customers/edit/:id', (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.json({
      success: false,
      message: 'A request body is required'
    });
  }
  Customer.findById(mongoose.Types.ObjectId(req.params.id))
    .then((customer) => {
      if (req.body.fullName) customer.fullName = req.body.fullName;
      if (req.body.mobileNumber) customer.mobileNumber = req.body.mobileNumber;
      if (req.body.email) customer.email = req.body.email;
      customer.save()
        .then(user => {
          res.json({
            success: true,
            customer: user
          });
        })
        .catch((e) => {
          res.status(400)
            .json({
              success: false,
              message: e.message
            });
        });
    })
    .catch((e) => {
      res.status(404)
        .json({
          success: false,
          message: e.message
        });
    });
});

router.put('/customers/edit/:id/image', upload.single('image'), (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(404)
      .json({
        success: false,
        message: 'A request body is required'
      });
  }
  // TODO:: Delete existing profile
  Customer.findById(mongoose.Types.ObjectId(req.params.id))
    .then((customer) => {
      if (req.body.fullName) customer.fullName = req.body.fullName;
      if (req.body.mobileNumber) customer.mobileNumber = req.body.mobileNumber;
      if (req.body.email) customer.email = req.body.email;
      customer.save()
        .then(user => {
          im.resize({
            srcPath: `public/images/uploads/customers/${req.file.filename}`,
            dstPath: `public/images/uploads/customers/thumb_${req.file.filename}`,
            width: 300,
            height: 300
          }, function (error, stdin, stdout) {
            if (error) {
              console.log(error);
            } else {
              console.log('Image resized successfully');
            }
          });
          res.json({
            success: true,
            customer: user
          });
        })
        .catch((e) => {
          res.json({
              success: false,
              message: e.message
            });
        });
    })
    .catch((e) => {
      res.json({
          success: false,
          message: e.message
        });
    });
});

module.exports = (app) => {
  app.use('/', router);
};
