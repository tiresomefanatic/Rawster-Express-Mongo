const mongoose = require("mongoose");
const {
    ObjectId
} = mongoose.Schema;
//const timestamps = require("mongoose-timestamp");

const matchSchema = new mongoose.Schema({



    name: String,

    acronym: String,

    creatorId: {
        type: ObjectId,
        ref: "User",
    },



    color: String,



    players: [{






        type: ObjectId,
        ref: "User",





    }],

    admins: [{




        type: ObjectId,
        ref: "User",





    }],










    invites: [{

        type: mongoose.Schema.Types.ObjectId,
        ref: "MatchInvite"







    }

    ],




    booking: {

        matchCreatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",

        },


        ground: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Grounds"
        },

        slot: {

            startTime: {
                type: Date
            },

            endTime: {
                type: Date

            },
        },



        status: {
            type: String,
            enum: ['No booking yet', 'Ground Selected', 'Slot Selected', 'Booked, Payment Pending', 'Payment Completed'],
            default: 'No booking yet'
        },

        price: {
            type: String
        },

        //Is THIS NECESSARY??
        paymentMode: {
            type: String,
            enum: ['Not yet paid', 'Cash at ground', 'Debit Card', 'Credit Card', 'UPI', 'Net Banking'],
        },
    },













}

);



module.exports = mongoose.model("Match", matchSchema);