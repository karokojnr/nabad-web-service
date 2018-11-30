const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HotelSchema = new Schema({
  applicantName: {
    type: String,
    required: true
  },
  businessEmail: {
    type: String,
    required: true,
    unique: true
  },
  mobileNumber: {
    type: Number,
    required: true
  },
  businessName: {
    type: String,
    required: true,
    unique: true
  },
  payBillNo: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  paymentStatus: {
    type: String,
    default: 'UNPAID'
  }
}, { timestamps: true });


module.exports = mongoose.model('Hotel', HotelSchema);
