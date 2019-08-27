const mongoose = require('mongoose');
const Joi = require('joi');

const { Schema, Types } = mongoose;

const OrderItemsSchema = new Schema({
  name: String,
  id: {
    type: Types.ObjectId,
    ref: 'Product'
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    default: 'NEW'
  },
  reason: String
});

const OrderItemJoiSchema = Joi.object({
  name: Joi.string()
    .required(),
  qty: Joi.number()
    .integer()
    .positive()
    .greater(0)
    .required(),
  price: Joi.number()
    .greater(0)
    .required()
});

const OrderPaymentsSchema = new Schema({
  method: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  transactionCode: {
    type: String
  }
});

const OrderPaymentsJoiSchema = Joi.object({
  method: Joi.string()
    .required(),
  amount: Joi.number()
    .positive()
    .required()
});

const OrderSchema = new Schema({
  status: {
    type: String,
    default: 'NEW'
  },
  hotel: {
    type: Object,
    default: {}
  },
  hotelId: {
    type: Types.ObjectId,
    ref: 'Hotel',
    require: true
  },
  totalItems: {
    type: Number,
    require: true
  },
  totalPrice: {
    type: Number,
    require: true
  },
  totalBill: {
    type: Number,
    default: 0.00
  },
  items: [OrderItemsSchema],
  payments: [OrderPaymentsSchema],
  servedBy: {
    type: Types.ObjectId,
    ref: 'User'
  },
  customerId: {
    type: Types.ObjectId,
    ref: 'Customer'
  }
}, { timestamps: true });

exports.validateOrderItemObject = (item) => Joi.validate(item, OrderItemJoiSchema);
exports.validateOrderPaymentObject = (payment) => Joi.validate(payment, OrderPaymentsJoiSchema);
exports.Order = mongoose.model('Order', OrderSchema);
exports.OrderItemSchema = mongoose.model('OrderItemsSchema', OrderItemsSchema);
exports.OrderPaymentsSchema = mongoose.model('OrderPaymentsSchema', OrderPaymentsSchema);
