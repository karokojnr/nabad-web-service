const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  unitMeasure: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  hotel: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: 'food.png'
  },
  sellingStatus: {
    type: Boolean,
    default: true
  },
  servedWith: {
    type: Array,
    default: []
  }
}, { timestamps: true });


module.exports = mongoose.model('Product', ProductSchema);
