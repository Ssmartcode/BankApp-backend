// MODELS
const User = require("../models/users");
const jwt = require("jsonwebtoken");

// ---CREATE A NEW USER---
const newUser = async (req, res, next) => {
  const { userName, userEmail, userAge, userPassword } = req.body;

  // check if an user with same userName exists in the data base
  let existingUser;
  try {
    existingUser = await User.findOne({ userName });
  } catch (err) {
    const error = new Error("Something went wrong. Please try again later");
    error.code = 500;
    next(error);
  }
  if (existingUser) {
    const error = new Error("This User name is taken. Please try another one");
    error.code = 401;
    return next(error);
  }

  // get data from user and create new record in the data base
  const newUser = new User({
    userName,
    userEmail,
    userAge,
    userPassword,
    isInitialized: false,
  });
  try {
    await newUser.save();
  } catch (err) {
    const error = new Error("Could not create the user. Please try again");
    error.code = 500;
    return next(error);
  }

  return res
    .status(201)
    .json({ message: "User has been successfuly created", newUser });
};

// ---LOGIN AN EXISTING USER---
const login = async (req, res, next) => {
  const { userName, userPassword } = req.body;

  // check if there is an user with same userName
  let existingUser;
  try {
    existingUser = await User.findOne({ userName });
  } catch (err) {
    const error = new Error("Something went wrong. Please try again later");
    error.code = 500;
    return next(error);
  }

  // in case the user is not in the data base
  if (!existingUser) {
    const error = new Error("Wrong credentials. Try again");
    error.code = 401;
    return next(error);
  }

  // in case the user exists, check if password is matching
  if (existingUser && existingUser.userPassword === userPassword) {
    const { id: userId, userName, isInitialized } = existingUser;
    const userData = { userId, userName, isInitialized };

    // create a token for the user
    const token = jwt.sign({ userId }, process.env.TOKEN_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      token,
      userData,
      message: "You are now logged in",
    });
  } else {
    const error = new Error("Wrong credentials. Try again");
    error.code = 401;
    return next(error);
  }
};

module.exports = { newUser, login };
