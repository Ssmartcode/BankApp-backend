// MODELS
const User = require("../models/users");

// CREATE A NEW USER
const newUser = async (req, res, next) => {
  const { userName, userEmail, userAge, userPassword } = req.body;

  // check if an user with same userName exists in the data base
  let existingUser;
  try {
    existingUser = await User.findOne({ userName });
  } catch (err) {
    const error = new Error("Something went wrong. Please try again later");
    next(error);
  }
  console.log(existingUser);
  if (existingUser) {
    const error = new Error("This User name is taken. Please try another one");
    return next(error);
  }

  // get data from user and create new record in the data base
  const newUser = new User({ userName, userEmail, userAge, userPassword });
  try {
    await newUser.save();
  } catch (err) {
    const error = new Error("Could not create the user. Please try again");
    return next(error);
  }

  return res.json({ message: "User has been successfuly created", newUser });
};

module.exports = { newUser };
