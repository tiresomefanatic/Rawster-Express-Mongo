const mongoose = require("mongoose");
const {
    ObjectId
} = mongoose.Schema;
//const timestamps = require("mongoose-timestamp");

const groundsSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,

    },

    location: {
        type: String
    },

    // images: [{
    //    // type: image links?? what to put here?
    // }]

    pricePerHalfHour: {
        type: String,
    },

    // discountedSlots: {
    //    // type: ?? 
    // }, 


    bookings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking"
    }]






















})

module.exports = mongoose.model("Grounds", groundsSchema);