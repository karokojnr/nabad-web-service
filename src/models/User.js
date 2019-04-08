const mongoose = require('mongoose');
const Joi = require('joi');

const { Schema, Types } = mongoose;

const UserSchema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  shortName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  hotel: {
    type: Types.ObjectId,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "WAITER"
  },
  permissions: {
    type: Array,
    default: ['/products', '/orders']
  }
}, { timestamps: true });

const emailSchema = Joi.string().email().lowercase().required();

UserSchema.methods.validateEmail = (email) => Joi.validate(email, emailSchema);

module.exports = mongoose.model('User', UserSchema);
