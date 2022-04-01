require('dotenv').config();
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');

const teamController = require('../controllers/teamController');

const s3Config = new AWS.S3({
	accessKeyId: 'AKIAWDUON3A6KOTKWYON',
	secretAccessKey: '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',
	Bucket: 'rawsterbucket'
});

const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

// this is just to test locally if multer is working fine.
const storage = multer.diskStorage({
	destination: (req, res, cb) => {
		cb(null, 'src/api/media/profiles');
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString() + '-' + file.originalname);
	}
});

//for team logo upload
const multerS3ConfigTeam = multerS3({
	s3: s3Config,
	bucket: 'rawsterbucket',
	metadata: function(req, file, cb) {
		cb(null, { fieldName: file.fieldname });
	},
	key: function(req, file, cb) {
		console.log(file);
		cb(null, 'Team-Logo' + '-' + req.team); // set the name of the file for s3
	}
});

const uploadTeam = multer({
	storage: multerS3ConfigTeam,
	fileFilter: fileFilter,
	limits: {
		fileSize: 1024 * 1024 * 5 // we are allowing only 5 MB files
	}
});

const multerS3ConfigUser = multerS3({
	s3: s3Config,
	bucket: 'rawsterbucket',
	metadata: function(req, file, cb) {
		cb(null, { fieldName: file.fieldname });
	},
	key: function(req, file, cb) {
		console.log(file);
		cb(null, 'User-Profile-Pic' + '-' + req.user.id);
	}
});

const uploadUser = multer({
	storage: multerS3ConfigUser,
	fileFilter: fileFilter,
	limits: {
		fileSize: 1024 * 1024 * 5 // we are allowing only 5 MB files
	}
});

exports.teamLogo = uploadTeam;

exports.profileImage = uploadUser;
