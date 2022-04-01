const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;
//const timestamps = require("mongoose-timestamp");

const teamSchema = new mongoose.Schema({
	name: String,

	acronym: String,

	creatorId: {
		type: ObjectId,
		ref: 'User'
	},

	color: String,

	team_logo: {
		type: {
			file_type: {
				type: String,
				// enum: getValues(fileTypes),
				required: true
			},
			file_name: {
				type: String,
				required: true
			},
			dir_path: {
				type: String,
				required: true
			},
			src: {
				type: String,
				required: true
			}
		}
	},

	players: [
		{
			type: ObjectId,
			ref: 'User'
		}
	],

	admins: [
		{
			type: ObjectId,
			ref: 'User'
		}
	],

	invites: [
		{
			invitedBy: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},

			invitee: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},

			date: {
				type: Date
			},

			team: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Teams'
			}
		}
	],

	channelId: {
		type: String,
		required: true
	}
});

module.exports = mongoose.model('Teams', teamSchema);
