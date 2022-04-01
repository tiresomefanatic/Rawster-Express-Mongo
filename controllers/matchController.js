const Team = require('../models/teamModel');
const Match = require('../models/matchModel')
const User = require('../models/userModel');
const Invite = require('../models/matchInviteModel');

const {
    protect
} = require('./authController');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const pubnub = require('../utils/pubnub')
//const { getUser } = require('./../utils/user');



// FINAL ADDITIONS - CHECK IF AUTH IN ALL EXPORTS 
//     - MAKE SURE ALL ARE ASYNC/AWAIT
//     - CLARIFY WHERE ALL AWAIT IS ACTUALLY NECESSARY <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<!!!!!!IMP!!!!!!
//     - CHECK QUERY FUNCTIONS TO SEE IF THEY HAVE PROMISE LOGIC ex: function (err,result) if (err) throw err if result proceed 
//     - ADD TYPE CHECKING 
//     - DOUBLE CHECK ALL EXPORTS TO SEE IF ALL POSSIBLE OUTCOMES HAVE BEEN ERROR CHECKED 







exports.matchById = (req, res, next, id) => {
    Match.findById(id)
        .populate("creatorId", "_id ")
        .exec((err, match) => {
            if (err || !match) {

                return res.status(400).json({
                    error: err,
                });
            }
            req.match = match.id;
            console.log(" this log is from teamByID", req.team)

            // adds post object in req with postedBy info
            next();
        });
};

async function exists(id = '', phone = 0, email = '') {
    const player = await User.findOne({
        $or: [{
            phone,
        },
        {
            email,
        },
        {
            id,
        },


        ],
    });

    if (player) {
        return {
            exists: true,
            player,
        };
    } else
        return {
            exists: false,
        };
}



exports.createMatch = catchAsync(async (req, res, next) => {

    const userId = req.user.id;
    console.log("is this it", userId)

    const newMatch = await Match.create({
        name: req.body.name,

        // bookingStatus: " "
        // bookingID: 

        // matchStatus: 
        creatorId: userId,
        players: [userId], // get from frontend req.body so that you can add multiple players at the same time. 
        admins: [userId],
        booking: {
            matchCreatedBy: userId,

            ground: null,

            slot: null,


            status: 'No booking yet',

            price: 'Slot not selected',

            //Is THIS NECESSARY??
            paymentMode: 'Not yet paid'
        }

        // invites: req.body.invites,
        // requests: req.body.requests,
    },
        // function (err, result) {

        //     if (err) {
        //         console.log("err from callback while creating new match ", err)
        //     } else {
        //         console.log("result from callback creating new match ", result)
        //     }

        // }
    );

    //console.log("NEW Match ID", newMatch._id)

    await pubnub.objects.setChannelMetadata({
        channel: newMatch.id,
        data: {
            name: newMatch.name
        },
        callback: function (result, err) {
            if (err) {
                console.log("pubnub match channel creation ERROR!", err)

            } else {
                console.log("pubnub match channel creation success", result)

            }
        },
    });

    await pubnub.objects.setChannelMembers({
        channel: newMatch.id,
        uuids: [userId],
        callback: function (result, err) {
            if (err) {
                console.log("pubnub match channel creation ERROR!", err)

            } else {
                console.log("pubnub match channel creation success", result)

            }
        },


    });



    // Create Booking Document 






    // error handling 
    //    -- check if schema is valid, 
    //    -- 


    res.status(200).json({
        status: 'success',


        data: {
            team: newMatch,


        }
    });
    // console.log(newTeam)
});



//******** Get ALL MATCHES 







exports.getMyMatches = catchAsync(async (req, res, next) => {

    const userId = req.user.id;

    await Match.find({
        "players": {
            $eq: userId
        },
    })
        //.populate("players", '_id firstname lastname')
        //.populate("admins", '_id firstname username')
        .select('_id name  ')

        .exec((err, match) => {
            if (err) {
                return res.status(400).json({
                    error: err,
                });

            }





            res.status(200).json({
                status: 'success',

                match

            });
        });
})



exports.getMatch = catchAsync(async (req, res, next) => {



    const match = await Match.findById(req.team)
        // .populate("players", 'firstname')
        .select("_id name creatorId")

        .populate("creatorId", 'firstname lastname')

        .populate("players", '_id firstname lastname')

        .populate("admins", '_id firstname username')


    if (!match) {
        return next(new AppError('No match found with that ID', 404));
    }


    //****** Any more error checking?  */

    await pubnub.objects.getChannelMetadata({
        channel: req.match,
    });

    await pubnub.objects.getChannelMembers({
        channel: req.match,
    })


    res.status(200).json({
        status: 'success',
        data: {
            match
        }
    });
});


exports.getMatchPlayers = catchAsync(async (req, res, next) => {

    const matchPlayers = await Match.findById(req.team)
        .populate("players", 'firstname lastname')
        .select(" _id name  ")


    if (!matchPlayers) {
        return next(new AppError('No match found with that ID', 404));
    }


    //****** Any more error checking?  */


    res.status(200).json({
        status: 'success',
        data: {
            matchPlayers
        }
    });
});


exports.getMatchAdmins = catchAsync(async (req, res, next) => {

    const matchAdmins = await Team.findById(req.team)
        .populate("admins", 'firstname lastname')
        .select(" _id name  ")



    if (!matchAdmins) {
        return next(new AppError('No match found with that ID', 404));
    }


    //****** Any more error checking?  */


    res.status(200).json({
        status: 'success',
        data: {
            matchAdmins
        }
    });
});










exports.editMatch = catchAsync(async (req, res, next) => {

    const userId = req.user.id;
    const currentMatch = req.match

    console.log("currmatch", currentMatch)

    console.log(" userId ", userId)


    const match = await Team.findById(currentTeam);

    if (!match) {
        return next(new AppError('No match found with that ID', 404));
    }



    //**** Any other error checks?, Like HTTP errors */



    const isAdmin = await match.admins.some((admin) => {
        return admin.equals(userId);
    });

    if (!isAdmin) {
        return next(new AppError('User is not an admin ', 403));
    }


    const newMatch = await Match.findByIdAndUpdate(

        currentMatch,




        {

            name: req.body.name,
            // acronym: req.body.acronym,
            // color: req.body.color,

        },

        {
            new: true,
            runValidators: true,
            omitUndefined: true //if request body empty, prevents from updating to null

        },


        function (err, result) {

            if (err) {
                console.log("err from callback", err)
            } else {
                console.log("result from callback", result)
            }

        }


    );

    await pubnub.objects.setChannelMetadata({
        channel: newMatch.id,
        data: {
            name: newMatch.name
        },
        callback: function (result, err) {
            if (err) {
                console.log("pubnub match channel update ERROR!", err)

            } else {
                console.log("pubnub match channel update success", result)

            }
        },
    });



    res.status(200).json({
        status: 'success',
        data: {
            newMatch
        }
    });
});






exports.addAdmin = catchAsync(async (req, res, next) => {

    const userId = req.user.id;
    const currentMatch = req.team;
    const playerId = req.body.admins // player that is being made the admin


    console.log("what is the player id ",
        playerId)

    console.log("what is the params", req.params)


    const match = await Team.findById(currentMatch)


    if (!match) {
        return next(new AppError('No match found with that ID', 404));
    }



    let isCreator = await userId == match.creatorId;

    if (!isCreator) {
        return next(new AppError('Only the team owner can make someone an admin', 403));
    }

    // **** Check if is in players array

    const isPlayer = await match.players.some((admin) => {
        return admin.equals(playerId);
    });

    if (!isPlayer) {
        return next(new AppError('This player is not part of the team ', 403));
    }



    const isAdmin = await match.admins.some((admin) => {
        return admin.equals(playerId);
    });

    if (isAdmin) {
        return next(new AppError('This player is already an admin ', 403));
    }


    await Match.update(

        currentMatch,

        // {
        //     admins: req.body.admins
        // },


        {
            $addToSet: {
                admins: playerId
                //mongoose.Types.ObjectId(req.body.admins),

            }
        },

        {
            new: true,
            omitUndefined: true //if request body empty, prevents from updating to null
            //safe: true,
            //upsert: true
        },


        function (err, result) {

            if (err) {
                console.log("err from callback", err)
            } else {
                console.log("result from callback", result)
            }

        }


    )


    res.status(200).json({
        status: 'success',
        // data: {
        //     match
        // }
    });
});







// This is for a member of a match to send invite to a user who is not in the team 
exports.sendInvite = catchAsync(async (req, res, next) => {
    const friendId = req.body.invitingUser;
    const userId = req.user.id;
    const currentMatch = req.team


    // Check if user is authenticatd


    // Get Recieving user info
    const recievingUser = await User.findById(
        friendId
    )

    if (!recievingUser) {
        return next(new AppError('No user found with that ID', 404));

    }




    // console.log(" this is the recieving user of friend request ", recievingUser)
    //currentUser = await userExist("id", userId);

    // Check if currentUser exist
    //if (!currentUser) error.errorHandler(403, "Not Authorized");

    // Check if currentTeam doesn't already have a pending request from other user

    const match = await Team.findById(

        currentMatch

    )


    if (!match) {
        return next(new AppError('No team found with that ID', 404));

    }


    const isPlayer = await match.players.some((player) => {
        return player.equals(friendId);
    });

    if (isPlayer) {
        return next(new AppError('This player is already in the team', 403));
    }

    const isAdmin = await match.admins.some((admin) => {
        return admin.equals(userId);
    });



    // CHECK IF INVITE EXISTS IN INVITES WITH CURRENT TEAM ID AND INVITEE === friendID

    const inviteExists = await Invite.findOne({
        $and: [
            {
                team: currentMatch,
            },
            {
                invitee: friendId,
            },


        ],
    },

        function (err, result) {

            if (err) {
                console.log("err from checking if invite already exists", err)
            } else {
                //return true
                console.log("result from callback invite exist check", result);
                // return next(new AppError('This Player is already invited to join this team ', 403));
            }


        });



    let inviteDetails =

    {
        invitedBy: userId,
        invitee: friendId,
        date: Date.now(),
        match: currentMatch,
        status: 'Invited',
        inviteType: (isAdmin) ? 'Admin Invite' : 'Player Invite'


    }




    //const inviteExists = await inviteExistsFunc).length

    if (inviteExists === null) {

        // create NEW Invite to fetch the same in both Match page and User notification page 

        const newInvite = await Invite.create(inviteDetails,

            function (err, result) {

                if (err) {
                    console.log("err from callback while creating invite ", err)
                } else {
                    console.log("result from callback creating invite ", result)
                }

            }



        );

        res.status(201).json({
            status: 'success',
            message: 'Invite sent Successfully',
            data: {
                invite: newInvite
            }
        });
    }



    else if (inviteExists && inviteExists.status === "Invited" || inviteExists.status === "Pending In from admin") {
        return next(new AppError('This Player is already invited to join this team ', 403));
    }
    // what about if invite status is rejected or rejected by admin?? // THEN WE REINVITE THEM SUPRATEEK!

    else if (inviteExists && inviteExists.status === "Rejected" || inviteExists.status === "Rejected by admin") {

        query = inviteExists
        update = inviteDetails,
            options = {

                new: true,
                omitUndefined: true //if request body empty, prevents from updating to null
                //upsert: true
            };

        await Invite.updateOne(query, update, options,





            function (err, result) {

                if (err) {
                    console.log(" user err from callback", err)
                } else {
                    console.log("user result from callback", result)

                    // emit socket events 
                }

            }


        )

        res.status(200).json({
            status: 'success',
            message: 'Updated'

        });




    }




    console.log(newInvite)

});












// This is for a user who is not in the team to request to join the team, 
//Also used by a user who is invited and accepts the invite (accept invite and request to join are the same)
// Also if inviteType === 'Admin Invite' directly joins the team 
exports.requests = catchAsync(async (req, res, next) => {

    const userId = req.user.id;
    const currentMatch = req.match

    // let requester = {
    //     "requester": userId,
    //     "status": "pending"
    // };

    console.log("what is the params", req.params)

    //   check if authenticated 
    // const user = await User.findById(userId);

    // console.log(" user's invite from this team ", user);


    const match = await Match.findById(

        currentMatch

    )


    if (!match) {
        return next(new AppError('No match found with that ID', 404));

    }




    const isPlayer = await match.players.some((admin) => {
        return admin.equals(userId);
    });

    if (isPlayer) {
        return next(new AppError('You are already in this team', 403));
    }


    // CHECK IF INVITE EXISTS, 

    const inviteExists = await Invite.findOne({
        $and: [
            {
                team: currentMatch,
            },
            {
                invitee: userId,
            },


        ],
    },

        function (err, result) {

            if (err) {
                console.log("err from checking if invite already exists", err)
            } else {
                //return true
                console.log("result from callback invite exist check", result);
                // return next(new AppError('This Player is already invited to join this team ', 403));
            }


        });

    if (inviteExists === null) {

        await Invite.create({
            invitedBy: userId,  // when fetching check if invitedBy and invitee Id is same if same show " Invited himself", if not show invitedBy id // replaced this with inviteType
            invitee: userId,
            date: Date.now(),
            team: currentMatch,
            status: 'Pending In from admin',
            inviteType: 'Self Request from invitee'

        },

            function (err, result) {

                if (err) {
                    console.log("err from callback while creating invite ", err)
                } else {
                    console.log("result from callback creating invite ", result)
                }

            }



        );

        res.status(200).json({
            status: 'success',
            message: 'New Invite Created'

        });

    }



    //IF INVITE EXISTS check the status of that invite, 

    // if status of that invite is " PENDING IN FROM ADMIN" then throw err saying pending acceptance from admin 


    else if (inviteExists && inviteExists.status === "Pending In from admin") {
        return next(new AppError('Wait for admin to accept or reject before requesting again', 403));

        // if status is " INVITED " then find the invite and update status to " PENDING IN FROM ADMIN " 
        // if statue is " REJECTED " then find the invite and update status to " PENDING IN FROM ADMIN  "
        // if status is " REJECTED BY ADMIN " then find the invite and update status to " PENDING IN FROM ADMIN"




    } else if (inviteExists && inviteExists.status === "Invited" || inviteExists.status === "Rejected" || inviteExists.status === "Rejected by admin") {

        query = inviteExists

        update = {




            status: 'Pending In from admin'

        },
            options = {

                new: true,
                omitUndefined: true //if request body empty, prevents from updating to null


                //upsert: true
            };

        await Invite.updateOne(query, update, options,





            function (err, result) {

                if (err) {
                    console.log(" user err from callback", err)
                } else {
                    console.log("user result from callback", result)

                    // emit socket events 
                }

            }


        )

        res.status(200).json({
            status: 'success',
            message: 'Requested to join'

        });




    } else if (inviteExists && inviteExists.status === "Invited" && inviteExists.inviteType === 'Admin Invite') {

        query = inviteExists

        update = {
            status: 'Joined'

        },
            options = {

                new: true,
                omitUndefined: true //if request body empty, prevents from updating to null

                //upsert: true
            };

        await Invite.updateOne(query, update, options,


            function (err, result) {

                if (err) {
                    console.log(" user err from callback", err)
                } else {
                    console.log("user result from callback", result)

                    // emit socket events 
                }

            }


        )

        matchquery = currentMatch
        matchupdate = {
            $addToSet: {
                players: userId
            },
        },
            matchoptions = {

                new: true,
                omitUndefined: true,
                //upsert: true
            };

        await Match.findByIdAndUpdate(matchquery, matchupdate, matchoptions,





            function (err, result) {

                if (err) {
                    console.log("err from callback adding player to match", err)
                } else {
                    console.log("result from callback adding player to match", result)

                    // emit socket events 
                }

            }


        );

        await pubnub.objects.setChannelMembers({
            channel: newMatch.id,
            uuids: [inviteeId],
            callback: function (result, err) {
                if (err) {
                    console.log("pubnub match channel creation ERROR!", err)

                } else {
                    console.log("pubnub match channel creation success", result)

                }
            },


        });

        res.status(200).json({
            status: 'success',
            message: 'Accepted Admin Invite and Joined Match'

        });




    }






});





//This is for a admin to accept a player's request to join the team 
exports.acceptRequest = catchAsync(async (req, res, next) => {

    const userId = req.user.id;
    const currentMatch = req.match;


    console.log(currentMatch)

    const inviteeId = req.body.invitee





    console.log("what is the params", req.params)


    const match = await Match.findById(currentTeam)


    if (!match) {
        return next(new AppError('No match found with that ID', 404));


    }



    const isAdmin = await match.admins.some((admin) => {
        return admin.equals(userId);
    });

    if (!isAdmin) {
        return next(new AppError(' Only Admins can accept requests ', 403));
    }




    const isPlayer = await match.players.some((player) => {
        return player.equals(inviteeId);
    });

    if (isPlayer) {
        return next(new AppError('This player is already in the team', 403));
    }




    // const requestExists = await team.requests.some(({
    //     "requester": requester
    // }) => {
    //     return requester.equals(requesterId);
    // });

    // if (!requestExists) {
    //     return next(new AppError(' Request not found ', 404));
    // }



    // CHECK IF INVITE EXISTS, 

    const inviteExists = await Invite.findOne({
        $and: [
            {
                team: currentMatch,
            },
            {
                invitee: inviteeId,
            },


        ],
    },

        function (err, result) {

            if (err) {
                console.log("err from checking if invite already exists", err)
            } else {
                //return true
                console.log("result from callback invite exist check", result);
                // return next(new AppError('This Player is already invited to join this team ', 403));
            }


        });



    if (inviteExists === null) {
        return next(new AppError('No invite for this user exists ', 403));

    } else if (inviteExists && inviteExists.status === "Invited" || inviteExists.status === "Rejected" || inviteExists.status === "Rejected by admin") {
        return next(new AppError('This player has not yet requested to join this team', 403));


    } else if (inviteExists && inviteExists.status === "Pending In from admin") {

        query = inviteExists

        update = {




            status: 'Joined Team'

        },
            options = {

                new: true,
                //upsert: true
            };

        await Invite.updateOne(query, update, options,





            function (err, result) {

                if (err) {
                    console.log(" user err from callback", err)
                } else {
                    console.log("user result from callback", result)

                    // emit socket events 
                }

            }


        )

    };




    query = currentMatch
    update = {
        $addToSet: {
            players: inviteeId
        },
    },
        options = {

            new: true,
            //upsert: true
        };

    const newMatch = await Match.findByIdAndUpdate(query, update, options,





        function (err, result) {

            if (err) {
                console.log("err from callback adding player to match", err)
            } else {
                console.log("result from callback adding player to match", result)

                // emit socket events 
            }

        }


    );

    await pubnub.objects.setChannelMembers({
        channel: newMatch.id,
        uuids: [inviteeId],
        callback: function (result, err) {
            if (err) {
                console.log("pubnub match channel creation ERROR!", err)

            } else {
                console.log("pubnub match channel creation success", result)

            }
        },


    });


    res.status(200).json({
        status: 'success',
        data: {
            newMatch

        }
    });
});


//This is for admin to decline a request 
exports.declineRequest = catchAsync(async (req, res, next) => {

    const userId = req.user.id;
    const currentMatch = req.match;


    console.log(currentMatch)

    const inviteeId = req.body.invitee





    console.log("what is the params", req.params)


    const match = await Match.findById(currentMatch)


    if (!match) {
        return next(new AppError('No match found with that ID', 404));


    }



    const isAdmin = await match.admins.some((admin) => {
        return admin.equals(userId);
    });

    if (!isAdmin) {
        return next(new AppError(' Only Admins can decline requests ', 403));
    }




    const isPlayer = await match.players.some((player) => {
        return player.equals(inviteeId);
    });

    if (isPlayer) {
        return next(new AppError('This player is already in the match', 403));
    }




    // const requestExists = await team.requests.some(({
    //     "requester": requester
    // }) => {
    //     return requester.equals(requesterId);
    // });

    // if (!requestExists) {
    //     return next(new AppError(' Request not found ', 404));
    // }



    // CHECK IF INVITE EXISTS, 

    const inviteExists = await Invite.findOne({
        $and: [
            {
                team: currentMatch,
            },
            {
                invitee: inviteeId,
            },


        ],
    },

        function (err, result) {

            if (err) {
                console.log("err from checking if invite already exists", err)
            } else {
                //return true
                console.log("result from callback invite exist check", result);
                // return next(new AppError('This Player is already invited to join this team ', 403));
            }


        });



    if (inviteExists === null) {
        return next(new AppError('No invite for this player exists ', 403));

    } else if (inviteExists && inviteExists.status === "Rejected") {
        return next(new AppError('This invite has been already been rejected by the Player', 403));

    } else if (inviteExists && inviteExists.status === "Rejected by admin") {
        return next(new AppError('This invite has already been rejected by an Admin', 403));


    } else if (inviteExists && inviteExists.status === "Invited") {
        return next(new AppError('Player of this invite has not accepted/requested this invite for you to reject it', 403));


    } else if (inviteExists && inviteExists.status === "Pending In from admin") {

        query = inviteExists

        update = {




            status: 'Rejected by admin'

        },
            options = {

                new: true,
                omitUndefined: true,
                //upsert: true
            };

        await Invite.updateOne(query, update, options,





            function (err, result) {

                if (err) {
                    console.log(" user err from callback", err)
                } else {
                    console.log("user result from callback", result)

                    // emit socket events 
                }

            }


        )

    };




    res.status(200).json({
        status: 'success',
        message: 'Player Request denied'
    });
});




// this is for user to Reject an Invite 
exports.declineInvite = catchAsync(async (req, res, next) => {

    const userId = req.user.id;
    const currentMatch = req.match;


    console.log(currentMatch)

    const inviteeId = req.body.invitee





    console.log("what is the params", req.params)


    const match = await Match.findById(currentTeam)


    if (!match) {
        return next(new AppError('No match found with that ID', 404));


    }



    // const isAdmin = await team.admins.some((admin) => {
    //     return admin.equals(userId);
    // });

    // if (!isAdmin) {
    //     return next(new AppError(' Only Admins can decline requests ', 403));
    // }




    // const isPlayer = await team.players.some((player) => {
    //     return player.equals(inviteeId);
    // });

    // if (isPlayer) {
    //     return next(new AppError('This player is already in the team', 403));
    // }




    // const requestExists = await team.requests.some(({
    //     "requester": requester
    // }) => {
    //     return requester.equals(requesterId);
    // });

    // if (!requestExists) {
    //     return next(new AppError(' Request not found ', 404));
    // }



    // CHECK IF INVITE EXISTS, 

    const inviteExists = await Invite.findOne({
        $and: [
            {
                team: currentMatch,
            },
            {
                invitee: inviteeId,
            },


        ],
    },

        function (err, result) {

            if (err) {
                console.log("err from checking if invite already exists", err)
            } else {
                //return true
                console.log("result from callback invite exist check", result);
                // return next(new AppError('This Player is already invited to join this team ', 403));
            }


        });



    if (inviteExists === null) {
        return next(new AppError('No invite for this player exists ', 403));

    } else if (inviteExists && inviteExists.status === "Rejected") {
        return next(new AppError('This invite has been already been rejected by you', 403));

    } else if (inviteExists && inviteExists.status === "Rejected by admin") {
        return next(new AppError('This invite has already been rejected by an Admin', 403));


    } else if (inviteExists && inviteExists.status === "Invited") {
        return next(new AppError('Player of this invite has not accepted/requested this invite for you to reject it', 403));


    } else if (inviteExists && inviteExists.status === "Pending In from admin" || inviteExists.status === "Invited") {

        query = inviteExists

        update = {




            status: 'Rejected'

        },
            options = {

                new: true,
                omitUndefined: true,
                //upsert: true
            };

        await Invite.updateOne(query, update, options,





            function (err, result) {

                if (err) {
                    console.log(" user err from callback", err)
                } else {
                    console.log("user result from callback", result)

                    // emit socket events 
                }

            }


        )

    };




    res.status(200).json({
        status: 'success',
        message: 'Player Request denied'
    });
});








// this is for player to cancel his own request 
exports.cancelMyRequest = catchAsync(async (req, res, next) => {

    const userId = req.user.id;
    const currentMatch = req.match;


    console.log(currentTeam)

    const inviteeId = req.body.invitee





    console.log("what is the params", req.params)


    const match = await Match.findById(currentTeam)


    if (!match) {
        return next(new AppError('No match found with that ID', 404));


    }



    // const isAdmin = await team.admins.some((admin) => {
    //     return admin.equals(userId);
    // });

    // if (!isAdmin) {
    //     return next(new AppError(' Only Admins can decline requests ', 403));
    // }




    const isPlayer = await match.players.some((player) => {
        return player.equals(inviteeId);
    });

    if (isPlayer) {
        return next(new AppError('You have already joined this team', 403));
    }




    // const requestExists = await team.requests.some(({
    //     "requester": requester
    // }) => {
    //     return requester.equals(requesterId);
    // });

    // if (!requestExists) {
    //     return next(new AppError(' Request not found ', 404));
    // }



    // CHECK IF INVITE EXISTS, 

    const inviteExists = await Invite.findOne({
        $and: [
            {
                team: currentMatch,
            },
            {
                invitee: inviteeId,
            },


        ],
    },

        function (err, result) {

            if (err) {
                console.log("err from checking if invite already exists", err)
            } else {
                //return true
                console.log("result from callback invite exist check", result);
                // return next(new AppError('This Player is already invited to join this team ', 403));
            }


        });



    if (inviteExists === null) {
        return next(new AppError('No request for this player exists ', 403));

        // } else if (inviteExists && inviteExists.status === "Rejected") {
        //     return next(new AppError('This invite has been already been rejected by the Player', 403));

    } else if (inviteExists && inviteExists.status === "Invited") {
        return next(new AppError('This invite can be either accepted or rejected but not deleted by you', 403));


    } else if (inviteExists && inviteExists.invitedBy !== userId) {
        return next(new AppError("You are not authorized to delete this invite", 403));


    } else if (inviteExists && inviteExists.invitedBy === userId && inviteExists.status === "Pending In from admin" || inviteExists.status === "Rejected" || inviteExists.status === "Rejected by admin") {

        query = { _id: inviteExists.id }




        await Invite.deleteOne(query,





            function (err, result) {

                if (err) {
                    console.log(" user err from callback", err)
                } else {
                    console.log("user result from callback", result)

                    // emit socket events 
                }

            }


        )

    };




    res.status(200).json({
        status: 'success',
        message: 'Your request has been deleted'
    });
});




// This is for a an invitor of the team to take back his invite or for admin to cancel the invite
exports.cancelInvite = catchAsync(async (req, res, next) => {

    const userId = req.user.id;
    const currentMatch = req.match;


    console.log(currentMatch)

    const inviteeId = req.body.invitee





    console.log("what is the params", req.params)


    const match = await Match.findById(currentTeam)


    if (!match) {
        return next(new AppError('No match found with that ID', 404));


    }



    const isAdmin = await match.admins.some((admin) => {
        return admin.equals(userId);
    });

    // if (!isAdmin) {
    //     return next(new AppError(' Only Admins can decline requests ', 403));
    // }




    const isUserIdInMatch = await match.players.some((player) => {
        return player.equals(userId);
    });

    if (!isUserIdInMatch) {
        return next(new AppError('You are not in this match to perform this action', 403));
    }



    const isPlayer = await match.players.some((player) => {
        return player.equals(inviteeId);
    });

    if (isPlayer) {
        return next(new AppError('Player has already joined this match', 403));
    }





    // const requestExists = await team.requests.some(({
    //     "requester": requester
    // }) => {
    //     return requester.equals(requesterId);
    // });

    // if (!requestExists) {
    //     return next(new AppError(' Request not found ', 404));
    // }



    // CHECK IF INVITE EXISTS, 

    const inviteExists = await Invite.findOne({
        $and: [
            {
                team: currentMatch,
            },
            {
                invitee: inviteeId,
            },


        ],
    },

        function (err, result) {

            if (err) {
                console.log("err from checking if invite already exists", err)
            } else {
                //return true
                console.log("result from callback invite exist check", result);
                // return next(new AppError('This Player is already invited to join this team ', 403));
            }


        });



    if (inviteExists === null) {
        return next(new AppError('No such invite exists for this player, Refresh for changes ', 403));

        // } else if (inviteExists && inviteExists.status === "Rejected") {
        //     return next(new AppError('This invite has been already been rejected by the Player', 403));

    } else if (inviteExists && inviteExists.status === "Pending In from admin ") {
        return next(new AppError('This invite has already been accepted, wait for admin to accept or reject the player', 403));


    } else if (!(inviteExists.invitedBy !== userId || !isAdmin)) {
        return next(new AppError("You are not authorized to delete this invite", 403));

        // Add NOR 


    } else if (inviteExists && inviteExists.invitedBy === userId && inviteExists.status === "Invited" || inviteExists.status === "Rejected" || inviteExists.status === "Rejected by admin") {

        query = { _id: inviteExists.id }

        await Invite.deleteOne(query,





            function (err, result) {

                if (err) {
                    console.log(" user err from callback", err)
                } else {
                    console.log("user result from callback", result)

                    // emit socket events 
                }

            }


        )

    };




    res.status(200).json({
        status: 'success',
        message: 'This invite has been deleted'
    });
});




// VS MATCHTYPEEEEEE



















































































































































































































































































































































































































































































exports.declineInvite = catchAsync(async (req, res, next) => { // decline invite 

    const userId = req.user.id;
    const currentTeam = req.team

    let requester = {
        "requester": userId,
        "status": "pending"
    };

    console.log("what is the params", req.params)


    const user = await User.findById(userId);

    console.log(" user's invite from this team ", user);


    const team = await Team.findById(

        currentTeam

    )


    if (!team) {
        return next(new AppError('No team found with that ID', 404));

    }




    const isPlayer = await team.players.some((admin) => {
        return admin.equals(userId);
    });

    if (isPlayer) {
        return next(new AppError('You are already in this team', 403));
    }








    const alreadyRequested = await team.requests.some(({
        "requester": requester
    }) => {
        return requester.equals(userId);
    });

    if (alreadyRequested) {
        return next(new AppError('You have already requested to join this team ', 403));
    }




    const isInvited = await team.invites.some(({
        "invitee": invitee
    }) => {
        return invitee.equals(userId);
    });

    console.log("isInvited?", isInvited)



    if (isInvited === true) {

        query = user
        update = {

            $pull: {
                teamrequests: {
                    team: currentTeam
                }
            }
        },
            options = {

                new: true,
                //upsert: true
            };

        await User.update(query, update, options,





            function (err, result) {

                if (err) {
                    console.log(" user err from callback", err)
                } else {
                    console.log("user result from callback", result)

                    // emit socket events 
                }

            }


        )


    }






    query = currentTeam
    update = {
        $pull: {
            requests: requester // is this necessary here 
        },
        $pull: {
            invites: {
                invitee: userId
            }
        }
    },
        options = {

            new: true,
            //upsert: true
        };

    await Team.update(query, update, options,





        function (err, result) {

            if (err) {
                console.log(" team err from callback", err)
            } else {
                console.log("team result from callback", result)

                // emit socket events 
            }

        }


    )










    res.status(200).json({
        status: 'success',
        data: {
            team
        }
    });
});













//OLD SEND INVITE CODE 





// const alreadyRequested = await team.requests.some(({
    //     "requester": requester
    // }) => {
    //     return requester.equals(friendId);
    // });

    // if (alreadyRequested) {
    //     return next(new AppError('This Player has already requested to join this team ', 403));
    // }


    // // Check if invite already exists
    // const alreadyInvited = await team.invites.some(({
    //     "invitee": invitee
    // }) => {
    //     return invitee.equals(friendId);
    // });

    // if (alreadyInvited) {
    //     return next(new AppError('This Player is already invited to join this team ', 403));
    // }



    // Check if requestingUser doesn't already have pending same request


    // Check if invitee is already in team 




    // Continue if no errors

    // Add to request count for receiving user
    //recievingUser.requests.count = recievingUser.requests.count + 1;

    // const contentData = {
    //     invitedBy: userId,
    //     invitee: friendId,
    //     date: Date.now(),
    //     team: currentTeam,
    //     status: 'Invited'

    // };


//     query = recievingUser
//     update = {
//         $addToSet: {
//             teamrequests: contentData
//         },

//     },
//         options = {

//             new: true,
//             //upsert: true
//         };

//     User.update(query, update, options,





//         function (err, result) {

//             if (err) {
//                 console.log("user err from callback", err)
//             } else {
//                 console.log("user result from callback", result)

//                 // emit socket events //send notification
//             }

//         }


//     )



//     query = currentTeam
//     update = {
//         $addToSet: {
//             invites: contentData
//         },

//     },
//         options = {

//             new: true,
//             //upsert: true
//         };

//     Team.update(query, update, options,



//         function (err, result) {

//             if (err) {
//                 console.log("team err from callback", err)
//             } else {
//                 console.log("team result from callback", result)

//                 // emit socket events //send notification 
//             }

//         }


//     )


//     // Send response back to client
//     res.status(200).json({
//         message: "Team request sent!",
//         status: 200,





// OLD REQUEST CODE 



    // // const alreadyRequested = await team.requests.some(({
    // //     "requester": requester
    // // }) => {
    // //     return requester.equals(userId);
    // // });

    // // if (alreadyRequested) {
    // //     return next(new AppError('You have already requested to join this team ', 403));
    // // }




    // // const isInvited = await team.invites.some(({
    // //     "invitee": invitee
    // // }) => {
    // //     return invitee.equals(userId);
    // // });

    // // console.log("isInvited?", isInvited)



    // if (isInvited === true) {

    //     query = user
    //     update = {

    //         $pull: {
    //             teamrequests: {
    //                 team: currentTeam
    //             }
    //         }
    //     },
    //         options = {

    //             new: true,
    //             //upsert: true
    //         };

    //     await User.update(query, update, options,





    //         function (err, result) {

    //             if (err) {
    //                 console.log(" user err from callback", err)
    //             } else {
    //                 console.log("user result from callback", result)

    //                 // emit socket events 
    //             }

    //         }


    //     )


    // }






    // query = currentTeam
    // update = {
    //     $addToSet: {
    //         requests: requester
    //     },
    //     $pull: {
    //         invites: {
    //             invitee: userId
    //         }
    //     }
    // },
    //     options = {

    //         new: true,
    //         //upsert: true
    //     };

    // await Team.update(query, update, options,





    //     function (err, result) {

    //         if (err) {
    //             console.log(" team err from callback", err)
    //         } else {
    //             console.log("team result from callback", result)

    //             // emit socket events 
    //         }

    //     }


    // )


