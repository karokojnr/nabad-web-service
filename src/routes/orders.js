const router = require('express').Router();
const { Order,
    OrderPaymentsSchema,
    OrderItemSchema,
    validateOrderPaymentObject,
    validateOrderItemObject } = require('../models/Order');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

// Orders list for a hotel
router.get('/hotel/orders', (req, res) => {
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
  Order
    .find(params)
    // .populate('users', 'servedBy')
    // .populate('hotel', 'businessName')
    .then((orders) => {
      res.json({ success: true, orders });
    }).catch((e) => {
    res.status(400).json({ success: false, message: e.message });
  });
});

// Orders list for a user
router.get('/user/orders', (req, res) => {
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
  Order
    .find(params)
    .then((orders) => {
      res.json({ success: true, orders });
    }).catch((e) => {
    res.status(400).json({ success: false, message: e.message });
  });
});

// Get specific order
router.get('/orders/:id', (req, res) => {
  Order.findById(req.params.id).then((order) => {
    res.json({ success: true, order });
  }).catch((e) => {
    res.status(400).json({ success: false, message: e.message });
  });
});

// Add a new order
router.post('/orders/add', (req, res) => {
  if (Object.keys(req.body).length === 0) {
    res.status(400).json({ success: false, message: 'A request body is required' });
  } else {
    console.log(req.body);
    const payments = req.body.payments;
    const items = req.body.items;
    delete req.body.items;
    delete req.body.payments;
    let order = new Order(req.body);

    _.each(items, (item) => {
      let orderItem = new OrderItemSchema({
        name: item.name,
        qty: item.qty,
        price: item.price
      });
      let { error } = validateOrderItemObject(orderItem);
      if (!!error){
        order.items.push(orderItem);
      } else {
        res.json({ success: false, message: error.message });
      }
    });
    _.each(payments, (payment) => {
      let orderPayment = new OrderPaymentsSchema({
        method: payment.method,
        amount: payment.amount,
        transactionCode: payment.hasOwnProperty('transactionCode') ? payment.transactionCode: ""
      });
      let { error } = validateOrderPaymentObject(orderPayment);
      if (!!error){
        order.payments.push(orderPayment);
      } else {
        res.json({ success: false, message: error.message });
      }
    });

    order.save().then((order) => {
      res.json({ success: true, order });
    }).catch((e) => {
      res.json({ success: false, message: e.message });
    });
  }
});

// Mark order as complete
router.put('/orders/:id/complete', (req, res) => {
  Order.findById(req.params.id).then((order) => {
    // Negate the current status
    order.status = 'COMPLETE';
    return order.save();
  }).then((order) => {
    res.json({ success: true, order });
  }).catch((e) => {
    res.status(400).json({ success: false, message: e.message });
  });
});

// Edit order
router.put('/orders/:id/edit', (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(404).json({ success: false, message: 'A request body is required' });
  }
  Order.findByIdAndUpdate(req.params.id, req.body, { new: true }).then((order) => {
    res.json({ success: true, order });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

// Delete order
router.delete('/orders/:id/delete', (req, res) => {
  Order.findByIdAndDelete(req.params.id).then((order) => {
    res.json({ success: true, order });
  }).catch((e) => {
    res.status(404).json({ success: false, message: e.message });
  });
});

module.exports = (app) => {
  app.use('/', router);
}
