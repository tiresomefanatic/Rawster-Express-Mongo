// Models
const User = require("../models/userModel");

// Helper functions
const error = require("./appError");

module.exports = {
  userExist: async (type, value) => {
    let user;

    switch (type) {
      case "id":
        user = await User.findById(value);
        return user;

      case "email":
        user = await User.findOne({ "details.email": value });
        return user;

      default:
        return;
    }
  },
  getUser: async (userId, select = null) => {
    const user = await User.findById(userId, select);

    if (!getUser) {
      return next(new AppError('User does not exist', 403));
    }

    return user;
  }
};
