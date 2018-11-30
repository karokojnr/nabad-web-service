const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "WAITER"
  },
  permissions: {
    type: Array,
    default: ['products']
  }
}, { timestamps: true });


module.exports = mongoose.model('User', UserSchema);
