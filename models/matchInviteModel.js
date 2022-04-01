const mongoose = require("mongoose");
const {
    ObjectId
} = mongoose.Schema;
//const timestamps = require("mongoose-timestamp");

const matchInviteSchema = new mongoose.Schema({







    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    invitee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },


    date: {
        type: Date,

    },

    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Match",

    },

    status: {
        type: String,
        enum: ['Invited', 'Rejected', 'Pending In from admin', 'Joined Match', 'Rejected by admin'],
        default: 'Invited'
    }










})

module.exports = mongoose.model("MatchInvite", matchInviteSchema);