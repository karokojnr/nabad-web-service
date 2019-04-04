const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const FeeSchema = new Schema({
    total: {
        type: Number,
        required: true
    },
    ordersId: {
        type: Array
    },
    day: {
        type: String,
        required: true
    },
    hotel: {
        type: Types.ObjectId,
        refs: 'Hotel',
        required: true
    },
    status: {
        type: String,
        default: 'UNPAID'
    }
}, { timestamps: true });


module.exports = mongoose.model('Fee', FeeSchema);
