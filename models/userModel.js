const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { ObjectId } = mongoose.Schema;

const userSchema = new mongoose.Schema({
	firstname: {
		type: String,
		required: [ true, 'Please tell us your First name!' ]
	},

	lastname: {
		type: String,
		required: [ true, 'Please tell us your Last name!' ]
	},

	phone: {
		type: String,
		required: [ true, 'Please enter your mobile number!' ]
	},

	email: {
		type: String,
		required: [ true, 'Please provide your email' ],
		unique: true,
		lowercase: true,
		validate: {
			validator: (email) => validator.isEmail(email),
			message: '{VALUE} is not a valid email'
		}
	},

	profile_pic: {
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

	Location: String,

	Gender: String,

	Position: String,

	teamrequests: [
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
			},

			teamLogo: String
		}
	],

	activeChats: [
		{
			userId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User'
			},
			firstname: String,
			lastname: String,
			profile_pic: String,
			channelID: String
		}
	]
});

friends: [
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User'
		},
		firstname: String,
		lastname: String,
		profile_pic: String
	}
];

userSchema.index({ firstname: 'text', lastname: 'text' });

module.exports = mongoose.model('User', userSchema);
