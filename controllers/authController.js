const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const authy = require('authy')(process.env.AUTHY_KEY);
const pubnub = require('./../utils/pubnub');

const signToken = (id) => {
	return jwt.sign(
		{
			id: id
		},
		process.env.JWT_SECRET,
		{
			expiresIn: process.env.JWT_EXPIRES_IN
		}
	);
};

const createSendToken = (user, statusCode, res) => {
	const token = signToken(user._id);
	const cookieOptions = {
		expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
		httpOnly: true
	};
	if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

	res.cookie('jwt', token, cookieOptions);

	// Remove password from output
	// user.password = undefined;
	return {
		token
	};
};

async function exists(id = '', phone = 0, email = '') {
	const player = await User.findOne({
		$or: [
			{
				phone
			},
			{
				email
			},
			{
				id
			}
		]
	});

	if (player) {
		return {
			exists: true,
			player
		};
	} else
		return {
			exists: false
		};
}

exports.signup = catchAsync(async (req, res, next) => {
	let phone = req.body.phone;
	let email = req.body.email;

	let phoneExists = await exists('', phone);
	let emailExits = await exists('', email);

	// if (phoneExists.exists) {
	//     return next(new AppError('Account with this Phone Number already exists, Please Login! '));
	// }

	// if (emailExits.exists) {
	//     return next(new AppError('Account with this Email already exists!'))
	// }

	const newUser = await User.create({
		firstname: req.body.firstname,
		lastname: req.body.lastname,
		phone,
		email,
		profile_pic: 'no profile picture yet'
	});

	// any other HTTP error checks?

	createSendToken(newUser, 200, res);
	const token = signToken(newUser._id);
	const currentUserId = newUser._id;
	const firstname = newUser.firstname;
	const lastname = newUser.lastname;
	const profile_pic = newUser.profile_pic;

	res.status(201).json({
		status: 'Sign Up success',
		userStatus: 'OLD_USER',

		firstname,

		lastname,

		token,

		currentUserId,

		profile_pic
	});
});

exports.auth = catchAsync(async (req, res, next) => {
	let { phone, otp, type } = req.body;

	let userExists = await exists('', phone);

	console.log('got phone', phone);

	if (!type) {
		return next(new AppError('Wrong type', 400));
	} else if (type === 'REQUEST') {
		const requestOTP = () => {
			return new Promise((s, e) => {
				authy.phones().verification_start(phone, '91', 'sms', function(err, res) {
					if (err) {
						console.log('from inside the promise', err);
						e(false);
					} else {
						console.log('REQUEST SUCCESS');
						console.log(res.message);
						s(true);
					}
				});
			});
		};

		const y = await requestOTP(); // not required here

		//console.log("from outisde", err); not working, TODO: Get the err from the requestOTP() promise and send in response.

		if (y) {
			res.status(200).json({
				status: 'success',
				message: 'otp sent',
				phone
			});
		} else {
			return next(new AppError('Otp request failed, check the number you entered or try again', 500));
		}
	} else if (type === 'VERIFY') {
		const verifyOTP = () => {
			return new Promise((s, e) => {
				authy.phones().verification_check(phone, '91', otp, function(err, res) {
					if (err) {
						console.log(err);
						s(false);
					} else {
						console.log('VERIFY SUCCESS');
						console.log(res.message);
						s(true);
					}
				});
			});
		};

		const v = await verifyOTP();

		if (v && userExists.exists === true) {
			console.log('player id', userExists.player.phone);

			createSendToken(userExists.player, 200, res);
			const token = signToken(userExists.player.id);
			(currentUserId = userExists.player.id),
				(firstname = userExists.player.firstname),
				(lastname = userExists.player.lastname),
				(profile_pic = userExists.player.profile_pic);
			res.status(200).json({
				status: 'success',
				userStatus: 'OLD_USER',
				message: 'User Exists, Login Success',
				token,
				currentUserId,
				firstname,
				lastname,
				profile_pic
			});
		} else if (v && userExists.exists === false) {
			res.status(200).json({
				status: 'success',
				message: 'User does not exist, Go to SignUp',
				userStatus: 'NEW_USER'
			});
		} else {
			return next(new AppError('invalid auth', 403));
		}
	}
});

exports.protect = catchAsync(async (req, res, next) => {
	// 1) Getting token and check of it's there
	let token;
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
		token = req.headers.authorization.split(' ')[1];
	}

	if (!token) {
		return next(new AppError('You are not logged in! Please log in to get access.', 401));
	}

	// 2) Verification token
	const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

	// 3) Check if user still exists
	const currentUser = await User.findById(decoded.id, '_id firstname lastname profile_pic.path');

	console.log('current user details ', currentUser);

	if (!currentUser) {
		return next(new AppError('The user belonging to this token does no longer exist.', 401));
	}

	// // 4) Check if user changed password after the token was issued
	// if (currentUser.changedPasswordAfter(decoded.iat)) {
	//     return next(
	//         new AppError('User recently changed password! Please log in again.', 401)
	//     );
	// }

	// GRANT ACCESS TO PROTECTED ROUTE
	req.user = currentUser;

	next();
	await pubnub.setUUID(currentUser._id);

	//next();

	await pubnub.objects.setUUIDMetadata({
		uuid: currentUser._id,

		data: {
			name: currentUser.firstname + '' + currentUser.lastname,
			profileUrl: currentUser.profile_pic.path
		}
	});

	await pubnub.addListener({
		status: function(statusEvent) {
			if (statusEvent.category === 'PNConnectedCategory') {
				console.log(' pubnub listener initialized ');
			}
		}
	});
});

// exports.isAdmin = catchAsync(async (req, res, next) => {

// })
