const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const teamController = require('./../controllers/teamController');
const matchController = require('./../controllers/matchController');

const router = express.Router();

router.use(authController.protect);


router.param("matchId", matchController.matchById);






router
    .route('/')
    .post(matchController.createMatch)



router.get('/mymatches', matchController.getMyMatches)


router.patch('/:matchId', matchController.editMatch)

router.patch('/addAdmin/:matchId', matchController.addAdmin)

router.patch('/request/:matchId', matchController.requests)

router.patch('/acceptrequest/:matchId', matchController.acceptRequest)



router.get('/:matchId', matchController.getMatch)

router.get('/matchPlayers/:matchId', matchController.getMatchPlayers)

router.get('/matchAdmins/:matchId', matchController.getMatchAdmins)

router.post('/sendInvite/:matchId', matchController.sendInvite)

//router.post('/sendMessage/:teamId', teamController.sendMessage)







module.exports = router;