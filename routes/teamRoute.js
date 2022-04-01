const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const teamController = require('./../controllers/teamController');

// const { upload } = require('./../utils/upload');

const { profileImage, teamLogo } = require('./../utils/upload.js');

const router = express.Router();

router.use(authController.protect);

router.param('teamId', teamController.teamById);

router.route('/').post(teamController.createTeam);

router.get('/myteams', teamController.getMyTeams);

router.patch('/:teamId', teamController.editTeam);

router.patch('/addAdmin/:teamId', teamController.addAdmin);

router.patch('/request/:teamId', teamController.requests);

router.patch('/acceptrequest/:teamId', teamController.acceptRequest);

router.get('/:teamId', teamController.getTeam);

router.get('/teamPlayers/:teamId', teamController.getTeamPlayers);

router.get('/teamAdmins/:teamId', teamController.getTeamAdmins);

router.post('/sendInvite/:teamId', teamController.sendInvite);

//router.post('/sendMessage/:teamId', teamController.sendMessage)
router.get('/searchusers/:teamId/:key', teamController.searchUsersToInvite);

router.post('/teamlogo/:teamId', teamLogo.single('teamLogo'), teamController.upload);

module.exports = router;
