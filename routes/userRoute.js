const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
//const teamController = require('./../controllers/teamController');

const { profileImage, teamLogo } = require('./../utils/upload.js');

const router = express.Router();

router.post('/auth', authController.auth);
router.post('/signup', authController.signup);

//router.post('/forgotPassword', authController.forgotPassword);
//router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect);

router.route('/').get(userController.getAllUsers);

router.get('/myprofile', userController.getMe);

router.get('/searchusers/:key', userController.searchUsers);

router.patch('/sendfirstmessage', userController.sendFirstMessage);

router.get('/getactivechat', userController.getActiveChat);

router.post('/profilepic/:userId', profileImage.single('profilePic'), userController.uploadProfilePic);

// router.get('/myteams', teamController.getMyTeams)

module.exports = router;
