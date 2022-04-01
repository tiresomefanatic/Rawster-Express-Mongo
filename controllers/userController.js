const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const pubnub = require('./../utils/pubnub');

exports.getAllUsers = catchAsync(async (req, res, next) => {
	const users = await User.find();

	// SEND RESPONSE
	res.status(200).json({
		status: 'success',
		results: users.length,
		data: {
			users
		}
	});
});

exports.getMe = catchAsync(async (req, res, next) => {
	await User.findOne({ _id: req.user.id }, 'firstname lastname profile_pic').exec((err, result) => {
		if (err) {
			// return res.status(400).json({
			//     error: err,
			//  });
			return next(new AppError('failed to fetch profile', err, 500));

			console.log('error from ', err);
		} else {
			res.status(200).json({
				status: 'success',
				currentUserId: result._id,
				firstname: result.firstname,
				lastname: result.lastname,
				profile_pic: result.profile_pic.path
			});
		}
	});
});

exports.getActiveChat = catchAsync(async (req, res, next) => {
	const recieverId = req.body.reciever;
	const userId = req.user.id;

	const reciever = await User.findById(recieverId);

	if (!reciever) {
		return next(new AppError('No user found with that ID', 404));
	}

	const activeChatExistsForReciever = await User.findOne(
		{
			_id: recieverId,
			activeChats: {
				$elemMatch: {
					userId: userId
				}
			}
		},
		{ 'activeChats.$': 1 }
	);

	const activeChatExistsForUser = await User.findOne(
		{
			_id: userId,
			activeChats: {
				$elemMatch: {
					userId: recieverId
				}
			}
		},
		{ 'activeChats.$': 1 }
	);

	if (!activeChatExistsForUser && !activeChatExistsForReciever) {
		return res.status(200).json({
			status: 'success',
			activeChatExists: false
		});
	}

	if (!activeChatExistsForUser && activeChatExistsForReciever) {
		return next(new AppError('Active chat exists for reciever but not for you, contact support', 404));
	}

	if (!activeChatExistsForUser && activeChatExistsForReciever) {
		return next(new AppError('Active chat exists for you but not for reciever, contact support', 404));
	}

	if (activeChatExistsForUser && activeChatExistsForReciever) {
		const userChannelId = activeChatExistsForUser.activeChats[0].channelID;
		const recieverChannelId = activeChatExistsForReciever.activeChats[0].channelID;

		console.log(' active chat from user ', userChannelId);
		console.log(' active chat from reciever ', recieverChannelId);

		if (userChannelId !== recieverChannelId) {
			return next(new AppError('Channel Ids DO NOT MATCH, contact support', 404));
		}

		if (userChannelId === recieverChannelId) {
			res.status(200).json({
				status: 'success',
				channelIDsMatch: true,
				activeChatExists: true,
				data: {
					channelID: userChannelId
				}
			});
		}
	}

	// SEND RESPONSE
	// res.status(200).json({
	//     status: 'success',
	//     results: users.length,
	//     data: {
	//         users
	//     }
	// });
});

exports.searchUsers = catchAsync(async (req, res, next) => {
	// var regex = new RegExp('^' + req.params.key, 'i')

	// aggregarte pipeline to combine firstname and lastname

	if (req.params.key.length === 0) {
		return next(new AppError('Search Empty, Type something to search', 404));
	} else
		return User.find(
			{
				$or: [
					// in this example we want to search at two fields 'firstname' and 'lastname'
					// however you can put any fields as you desire
					{ firstname: { $regex: '^' + req.params.key, $options: 'i' } },
					{ lastname: { $regex: '^' + req.params.key, $options: 'i' } }
				]
			},
			function(err, result) {
				if (err) {
					return res.status(400).json({
						status: 'error occured in func',
						error: err
					});
				} else {
					return res.status(200).json({
						status: 'success',

						data: {
							result
						}
					});
				}
			}
		).select(' _id firstname lastname');
});

exports.sendFirstMessage = catchAsync(async (req, res, next) => {
	const userId = req.user.id;
	const user = req.user;
	const recieverId = req.body.reciever;
	const message = [
		{
			_id: 'b4f3ce14-7830-44cc-26e0-ac5c57c17e2a',
			createdAt: '2021-03-23T20:38:37.795Z',
			text: 'FIRST TEST MANNN',
			user: {
				_id: '6037e5aae225c7d290c2881e',
				name: 'Suprateek2'
			}
		}
	];

	//console.log("user details", userId)

	const reciever = await User.findById(recieverId).select('_id firstname lastname ').populate('activeChats');

	if (!reciever) {
		return next(new AppError('No user found with that ID', 404));
	}

	// const activeChatExistsForReciever = await User.findOne({
	//     _id: recieverId,
	//     activeChats: {
	//         $elemMatch: {
	//             userId: userId
	//         }
	//     }
	// }, { 'activeChats.$': 1 })

	// const activeChatExistsForUser = await User.findOne({
	//     _id: userId,
	//     activeChats: {
	//         $elemMatch: {
	//             userId: recieverId
	//         }
	//     },

	// }, { 'activeChats.$': 1 })

	// //console.log("reciever", activeChatExistsForReciever)

	// //console.log("user", activeChatExistsForUser)

	// if (activeChatExistsForUser && activeChatExistsForReciever) {
	//     return next(new AppError('Cannot send First Message, active chat already exists, reload page', 404));

	// }

	// if (activeChatExistsForUser && !activeChatExistsForReciever) {
	//     return next(new AppError('Active chat exists for you but not for reciever, contact support', 404));

	// }

	// if (!activeChatExistsForUser && activeChatExistsForReciever) {
	//     return next(new AppError('Active chat exists for reciever but not for you, contact support', 404));

	// }

	// generate uuid for the channel
	/**
* This generates random ids like this: 6b33fce8-1745-f8de-4ad8-4ee42585oprf
*/
	const guidGenerator = () => {
		var S4 = function() {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4();
	};

	const UUID = guidGenerator();

	//console.log("Genrated ID", UUID)

	//if (!activeChatExistsForUser && !activeChatExistsForReciever) {

	//try {
	pubnub
		.publish({
			message: message,
			channel: UUID
		})
		.then((response) => {
			// console.log("publish response", response); // {timetoken: "14920301569575101"}
			pubnub.objects
				.setChannelMetadata({
					channel: UUID,
					data: {
						custom: {
							lasttimetoken: response.timetoken
						}
					},

					callback: function(result, err) {
						if (err) {
							console.log('pubnub P2P channel creation ERROR!', err);
						} else {
							console.log('pubnub P2P channel creation success', result);
						}
					}
				})
				.then(() => {
					pubnub.objects
						.setChannelMembers({
							channel: UUID,
							uuids: [ userId, recieverId ],
							callback: function(result, err) {
								if (err) {
									console.log('pubnub p2p set channel members creation ERROR!', err);
								} else {
									console.log('pubnub p2p set channel members creation success', result);
								}
							}
						})
						.then(async () => {
							// create active chat in both user and reciever activeChats array

							// in user's

							let userUpdate = {
								$addToSet: {
									activeChats: {
										userId: recieverId,
										firstname: reciever.firstname,
										lastname: reciever.lastname,
										channelID: UUID
									}
								}
							};
							let userOptions = {
								new: true,
								omitUndefined: true

								//upsert: true
							};

							await User.findByIdAndUpdate(userId, userUpdate, userOptions, function(err, result) {
								if (err) {
									console.log("err from callback adding reciever to user's active chat ", err);
								} else {
									console.log("result from callback adding reciever to user's active chat ", result);

									// emit socket events
								}
							});

							let recieverUpdate = {
								$addToSet: {
									activeChats: {
										userId: userId,
										firstname: user.firstname,
										lastname: user.lastname,
										channelID: UUID
									}
								}
							};

							let recieverOptions = {
								new: true,
								omitUndefined: true

								//upsert: true
							};

							await User.findByIdAndUpdate(recieverId, recieverUpdate, recieverOptions, function(
								err,
								result
							) {
								if (err) {
									console.log("err from callback adding user to reciever's active chats ", err);
								} else {
									console.log("result from callback adding user to reciever's active chats", result);

									// emit socket events
								}
							});

							return res.status(200).json({
								status: 'success'
							});
						})
						.catch((err) => {
							return next(new AppError(err.message, 500));
						});
				})
				.catch((err) => {
					return next(new AppError(err.message, 500));
				});

			//console.log("channel updated with timetoken", response.timetoken); // {timetoken: "14920301569575101"}
		})
		.catch((err) => {
			return next(new AppError(err.message, 500));
		});

	// if (err) {
	//     return next(new AppError('PUBNUB ERROR', 500));

	// }

	// Ensure success or failure of pubnub func

	/*} catch (err) {
        console.log("error from pubnub functions ", err)
        // send to custom analytics server
        throw err;


    }*/
	// }
});

exports.uploadProfilePic = catchAsync(async (req, res, next) => {
	const errTitle = 'Error when uploading avatar.';

	if (!req.file) {
		return next(new AppError('no file provided', 404));
	}

	const data = {
		originalName: req.file.originalname,
		format: req.file.mimetype,
		path: req.file.location
	};

	//try {
	await User.findByIdAndUpdate(
		req.user.id,
		{
			profile_pic: data
		},
		{
			new: true
		},
		function(err, result) {
			if (err) {
				console.log(err);
				return next(new AppError('profile update failed', err, 500));
			} else {
				return res.status(200).json({
					status: 'success uploading',

					data: {
						result
					}
				});
			}
		}
	);

	console.log(' firm data', req.file);

	// } catch (err) {
	// 	return next(new AppError('server error while team logo upload', err, 500));
	// }
});

// friendship system

// user sends friend request

// requester sends request ( creates request in seperate model )
//check if already friends
// check if request exits - you already have a request from this user accept it to become friends
// check if request exits - you already sent a request to this user wait for them to accept
// add both to each other's friends list
