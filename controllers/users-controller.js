const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");

const generateIBAN = require("../utilities/generateIBAN");
// MODELS
const User = require("../models/users");
const Account = require("../models/accounts");

// ---CREATE A NEW USER---
const newUser = async (req, res, next) => {
  const { userName, userEmail, userAge, userPassword } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Datele introduse nu sunt valide");
    return next(err);
  }
  // check if an user with same userName exists in the data base
  let existingUser;
  try {
    existingUser = await User.findOne({ userName });
  } catch (err) {
    const error = new Error("Ceva nu a mers. Te rog incearca mai tarziu");
    error.code = 500;
    next(error);
  }
  if (existingUser) {
    const error = new Error("Un utilizator cu acest nume exista deja.");
    error.code = 401;
    return next(error);
  }

  // hash the password before storing it
  const encryptedPassword = await bcrypt.hash(userPassword, 10);

  // get data from user and create new record in the data base
  const newUser = new User({
    userName,
    userEmail,
    userAge,
    userPassword: encryptedPassword,
    userAccountsLimit: 5,
    isInitialized: false,
  });

  try {
    await newUser.save();
  } catch (err) {
    console.log(err);
    const error = new Error("Contul nu a putut fi creat. Incearca mai tarziu!");
    error.code = 500;
    return next(error);
  }

  return res
    .status(201)
    .json({ message: "Contul a fost creat cu succes!", newUser });
};

// ---LOGIN AN EXISTING USER---
const login = async (req, res, next) => {
  const { userName, userPassword } = req.body;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Datele introduse nu sunt valide");
    return next(err);
  }

  try {
    existingUser = await User.findOne({ userName });
  } catch (err) {
    console.log(err);
    const error = new Error("Ceva nu a mers. Te rog incearca mai tarziu");
    error.code = 500;
    return next(error);
  }

  // in case the user is not in the data base
  if (!existingUser) {
    const error = new Error("Credentialele introduse sunt incorecte");
    error.code = 401;
    return next(error);
  }

  // in case the user exists, check if password is matching
  const matchingPassword = await bcrypt.compare(
    userPassword,
    existingUser.userPassword
  );
  if (existingUser && matchingPassword) {
    const { _id: userId, userEmail, userName, isInitialized } = existingUser;
    const userData = { userId, userEmail, userName, isInitialized };

    // create a token for the user
    const token = jwt.sign({ userId }, process.env.TOKEN_SECRET, {
      expiresIn: "30m",
    });
    res.status(200).json({
      token,
      userData,
      message: "V-ati autentificat cu succes",
    });
  } else {
    const error = new Error("Credentialele introduse sunt incorecte");
    error.code = 401;
    return next(error);
  }
};

// INITIALIZATION (ADD MORE IFNORMATIONS ABOUT THE USER)
const initialization = async (req, res, next) => {
  // throw error if user is not authenticated
  if (!req.userData) {
    const error = new Error("Va rog sa va autentificati inainte de a continua");
    error.code = 401;
    return next(error);
  }

  // validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    const err = new Error("Datele introduse nu sunt valide");
    return next(err);
  }

  // get user data from data base
  const { userId } = req.userData;
  let existingUser;
  try {
    existingUser = await User.findById(userId);
  } catch (err) {
    const error = new Error("Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }

  // check if image was uploaded
  if (!req.file) {
    const error = new Error("Va rog sa selectati o imagine!");
    error.code = 422;
    return next(error);
  }

  // get data from client and add it to the user profile
  const { fullName, userPhone, accountType, accountCurrency } = req.body;
  existingUser.fullName = fullName;
  existingUser.userPhone = userPhone;
  existingUser.userImage = req.file.filename;
  existingUser.isInitialized = true;

  // create first bank account for user
  const transactionHistory = {
    type: "created",
    timeStamp: new Date(),
  };
  // generate new IBAN
  const accountIBAN = generateIBAN();

  const account = new Account({
    accountType,
    accountCurrency,
    accountDeposit: 0,
    accountIBAN,
    accountOwner: req.userData.userId,
  });
  account.transactionsHistory.push(transactionHistory);

  // save account and user profile in DB
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await account.save({ session: sess });
    existingUser.userAccounts.push(account);
    await existingUser.save({ session: sess });

    sess.commitTransaction();
  } catch (err) {
    console.log(err);
    const error = new Error("Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }
  return res.status(201).json({ message: "successfuly added" });
};

const getUserData = async (req, res, next) => {
  const userId = req.params.id;

  // find the user in the data base
  let existingUser;
  try {
    existingUser = await User.findById(userId).select("-userPassword");
  } catch (err) {
    const error = new Error("Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }

  // return error if no user has been found
  if (!existingUser) {
    const error = new Error(
      "Nu am gasit niciun utilizator, va rog incercatii mai tarziu"
    );
    error.code = 404;
    return next(error);
  }

  // send the user data from the data base to the client
  res.status(200).json({ userData: existingUser });
};

module.exports = { newUser, login, initialization, getUserData };
