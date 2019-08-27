const mongoose = require('mongoose');
const Joi = require('joi');

const { Schema, Types } = mongoose;

const CustomerSchema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  username: {
    type: String,
    default: this.fullName
  },
  mobileNumber: {
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  password: {
    type: String,
    required: true
  },
  profile: {
    type: String,
    default: 'avater.png'
  },
  FCMToken: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const emailSchema = Joi.string()
  .email()
  .lowercase()
  .required();

CustomerSchema.methods.validateEmail = (email) => Joi.validate(email, emailSchema);

module.exports = mongoose.model('Customer', CustomerSchema);
