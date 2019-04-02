const router = require('express').Router();
const { Order,
    OrderPaymentsSchema,
    OrderItemSchema,
    validateOrderPaymentObject,
    validateOrderItemObject } = require('../models/Order');
const Hotel = require('../models/Hotel');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const axios = require('axios');
const https = require('https');
const fs = require('fs');
const {google} = require('googleapis');

var MESSAGING_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
var SCOPES = [MESSAGING_SCOPE];
var projectID;

function getAccessToken() {
  return new Promise(function(resolve, reject) {
    var key = require('../../service-account.json');
    projectID = key.project_id;
    var jwtClient = new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      SCOPES,
      null
    );
    jwtClient.authorize(function(err, tokens) {
      if (err) {
        reject(err);
        return;
      }
      resolve(tokens.access_token);
    });
  });
}

function getNotificationMessage(orderStatus) {
  console.log(orderStatus);
  let message = 'Your order was updated';
  let update = 'update';

  if(orderStatus == 'BILLS') {
    message = 'Your order has been accepted and will be delivered soon';
    update = 'accepted';
  }

  if(orderStatus == 'NEW') {
    message = 'You have a new order';
    update = '';
  }

  if(orderStatus == 'PAID') {
    message = 'Your bill has been paid';
    update = 'paid';
  }

  if(orderStatus == 'SALES') {
    message = 'Your bill is ready';
    update = 'billed';
  }


  if( orderStatus == 'REJECTED') {
    message = 'Your order was rejected';
    update = 'rejected';
  }

  if(orderStatus == 'RE-ORDER') {
    message = 'Item added to order';
    update = 're-ordered';
  }

  if(orderStatus == 'COMPLETE') {
    message = 'Your order is complete. Thank you for using Nadab Hotel Services';
    update = 'complete';
  }

  
  return { message, update };
}

function sendNotification(authToken, deviceToken, title, body, order) {
  axios.post( `https://fcm.googleapis.com/v1/projects/${projectID}/messages:send`, 
    {
      "message":{
        "token" : deviceToken,
        "data": {
          "orderID": order._id,
          "status": order.status,
          "body" : body,
          "title" : `Order ${title}`
        }
      }  
    },
    {
      headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  }).then( response => {
    console.log("Notification sent...");
  }).catch(error => {
    console.log(error.message);
  });
}

function addOrder(){}

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

  let params = hotel.id ? { hotelId: mongoose.Types.ObjectId(hotel.id) } : {};
  Order
    .find(params)
    .sort({ 'createdAt': 'desc'})
    .populate('customerId', 'fullName')
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

  let params = hotel.id ? { hotelId: mongoose.Types.ObjectId(hotel.id) } : {};
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
  Order
  .findById(req.params.id)
  .populate('customerId', 'fullName')
  .then((order) => {
    res.json({ success: true, order });
  }).catch((e) => {
    res.status(400).json({ success: false, message: e.message });
  });
});

// Orders list for a customer <customer app>
router.get('/customer/orders', (req, res) => {
  let customer = {}

  if (req.headers['x-token'] || req.query['token']) {
    let token = "";
    if (req.headers['x-token'] !== undefined) token = req.headers['x-token'];
    if (req.query['token'] !== undefined) token = req.query['token'];
    jwt.verify(token, process.env.SESSIONKEY, function(error, decode) {
      if (error) {
        throw new Error(error.message);
      } else {
        customer = decode;
      }
    });
  }

  let params = customer.id ? { customerId: mongoose.Types.ObjectId(customer.id) } : {};
  Order
    .find(params)
    .populate('hotel', 'businessName')
    .then((orders) => {
      res.json({ success: true, orders });
    }).catch((e) => {
    res.status(400).json({ success: false, message: e.message });
  });
});

// Add a new order
router.post('/orders/add', (req, res) =>{
  if (Object.keys(req.body).length === 0) {
    res.json({ success: false, message: 'A request body is required' });
  } else {
    const payments = req.body.payments;
    const items = req.body.items;
    delete req.body.items;
    delete req.body.payments;
    let order = new Order(req.body);
    order.hotelId = req.body.hotelId;
    let itemsMessage = '';

    _.each(items, (item) => {
      itemsMessage += `${item.qty} ${item.name} @ ${item.price} \n`;
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

    let {message, update } = getNotificationMessage(order.status);
    order.save().then((o) => {
      Hotel.findById(req.body.hotelId).then(hotel => {
        order = o;
        order.hotel = hotel;
        getAccessToken().then(accessToken => {
          sendNotification(accessToken, hotel.FCMToken, message, itemsMessage, order);
        }).catch(error => {
          console.log(error.message);
        });
      }).catch(error => {
        console.log(error.message);
        return res.json({ success: false, message: error.message });
      });
      res.json({ success: true, order });
    }).catch((e) => {
      res.json({ success: false, message: e.message });
    });
  }
});

router.post('/orders/:id/addItem', async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    res.status(400).json({ success: false, message: 'A request body is required' });
  } else {
  
    const items = [req.body];
    let itemsMessage = '';
    let order = {};
    try{
      order = await Order.findById(req.params.id);
    } catch(e) {
      return res.json({ success: false, message: e.message });
    };

    _.each(items, (item) => {
      itemsMessage += `${item.qty} ${item.name} @ ${item.price} \n`;
      let orderItem = new OrderItemSchema({
        name: item.name,
        qty: item.qty,
        price: item.price
      });
      let { error } = validateOrderItemObject(orderItem);
      if (!!error){
        order.totalItems += 1;
        order.totalPrice += orderItem.price;
        order.status = 'RE-ORDER';
        order.items.push(orderItem);
      } else {
        res.json({ success: false, message: error.message });
      }
    });

    let { message, update } = getNotificationMessage(order.status);
    order.save().then((order) => {
      Hotel.findById(order.hotelId).then(hotel => {
        getAccessToken().then(accessToken => {
          sendNotification(accessToken, hotel.FCMToken, message, itemsMessage, order);
        }).catch(error => {
          console.log(error.message);
        });
      }).catch(error => {
        console.log(error.message);
      });
      res.json({ success: true, order });
    }).catch((e) => {
      res.json({ success: false, message: e.message });
    });
  }
});

// Mark order as complete
router.put('/orders/:id/:status', (req, res) => {
  Order
    .findByIdAndUpdate(req.params.id, { status: req.params.status }, { new: true })
    .populate('customerId', 'fullName')
    .then(async (order) => {
      let customer = await Customer.findById(order.customerId);
      let { message, update } = getNotificationMessage(order.status);
      getAccessToken().then(accessToken => {
        (order.status !== 'HIDDEN') ? sendNotification(accessToken, customer.FCMToken, update, message, order): "";
      }).catch(error => {
        console.log(error.message);
      });
      res.json({ success: true, order });
  }).catch((e) => {
    console.log(e)
    res.status(400).json({ success: false, message: e.message });
  });
});

router.put('/orders/:orderId/all/:status', (req, res) => {
  Order
    .findById(req.params.orderId)
    .populate('customerId', 'fullName')
    .then(async (order) => {
      let customer = await Customer.findById(order.customerId);
      order.items.forEach((item) => { 
         if(req.params.status == 'ACCEPTED' || req.params.status == 'REJECTED') item.status = req.params.status;
         if(req.params.status == 'ACCEPTED') order.totalBill += item.price;
        });
      // Move the order to bills if all have been accepted
      if(req.params.status == 'ACCEPTED') order.status = 'BILLS';
      if(req.params.status == 'REJECTED') order.status = 'REJECTED';
      if(req.params.status == 'PAID') order.status = 'SALES';
      if(req.params.status == 'COMPLETE') order.status = 'COMPLETE';
      if(req.params.status == 'CANCEL') order.status = 'CANCELED';
      
      let { message, update } = getNotificationMessage(order.status);
      getAccessToken().then(accessToken => {
          sendNotification(accessToken, customer.FCMToken, update, message, order);
        }).catch(error => {
          console.log(error.message);
        });
      order = await order.save({ new: true });
    res.json({ success: true, order });
  }).catch((e) => {
    console.log(e)
    res.status(400).json({ success: false, message: e.message });
  });
});

router.put('/orders/:orderId/:itemId/:status', (req, res) => {
  Order
    .findById(req.params.orderId)
    .populate('customerId', 'fullName')
    .then(async (order) => {
      let customer = await Customer.findById(order.customerId);
      if(order.status == 'NEW') order.status = 'BILLS';
      let { message, update } = getNotificationMessage(order.status);
      order.items.filter((item) => { 
        if(item._id == req.params.itemId){
          item.status = req.params.status;
          if(req.params.status == 'ACCEPTED') order.totalBill += item.price;
        }
      });
      getAccessToken().then(accessToken => {
        sendNotification(accessToken, customer.FCMToken, update, message, order);
        }).catch(error => {
          console.log(error.message);
        });
      order = await order.save({ new: true });
    res.json({ success: true, order });
  }).catch((e) => {
    console.log(e)
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
