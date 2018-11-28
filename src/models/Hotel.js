const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HotelSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  slug: { type: String },
  blogs: {
    type: Number,
    default: 0
  }
}, { timestamps: true });


module.exports = mongoose.model('Hotel', HotelSchema);
