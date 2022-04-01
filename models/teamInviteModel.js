const mongoose = require("mongoose");
const {
    ObjectId
} = mongoose.Schema;
//const timestamps = require("mongoose-timestamp");

const teamInviteSchema = new mongoose.Schema({







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

    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teams",

    },

    status: {
        type: String,
        enum: ['Invited', 'Rejected', 'Pending In from admin', 'Joined Team', 'Rejected by admin', 'Not Working'],
        default: 'Invited'
    }










})

module.exports = mongoose.model("TeamInvite", teamInviteSchema);