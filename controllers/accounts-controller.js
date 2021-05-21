const mongoose = require("mongoose");
const { findByIdAndDelete } = require("../models/accounts");

const Account = require("../models/accounts");
const User = require("../models/users");

// GET
const getAccountInfo = async (req, res, next) => {
  // get user account from DB
  const accountId = req.params.id;
  let userAccount;
  try {
    userAccount = await Account.findById(accountId);
  } catch (err) {
    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }

  // throw error if no account has been found
  if (!userAccount) {
    const error = new Error("Contul dumneavoastra nu a putut fi gasit");
    error.code = 404;
    return next(error);
  }

  // send account info to the client
  res.status(200).json({ accountData: userAccount });
};

// CREATE
const createAccount = async (req, res, next) => {
  const { accountType, accountCurrency } = req.body;
  // get the user that made the post request
  let existingUser;
  try {
    existingUser = await User.findById(req.userData.userId).select(
      "-userPassword"
    );
  } catch (err) {
    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }

  // create new account
  const userAccount = new Account({
    accountType,
    accountCurrency,
    accountDeposit: 0,
    accountOwner: req.userData.userId,
  });

  let limitExceed;
  try {
    // check if limit of accounts has exceeded
    if (existingUser.userAccounts.length === existingUser.userAccountsLimit) {
      limitExceed = true;
      throw new Error();
    }

    // if limit is not exceeded add acount to DB
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await userAccount.save({ session: sess });
    existingUser.userAccounts.push(userAccount);
    await existingUser.save({ session: sess });

    sess.commitTransaction();
  } catch (err) {
    let error;
    if (limitExceed) error = new Error("Ai atins limita de 5 conturi.");
    else {
      error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    }
    error.code = 500;
    return next(error);
  }
  return res.status(201).json({
    message: "Contul tau bancar a fost creat cu succes",
    userData: existingUser,
  });
};

// DELETE
const deleteAccount = async (req, res, next) => {
  const accountId = req.params.id;
  const requestingUser = req.userData.userId;

  // find the account in the data base
  let existingAccount;
  try {
    existingAccount = await Account.findById(accountId);
  } catch (err) {
    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }

  // if no existing account has been found -> send error
  if (!existingAccount) {
    const error = new Error("Contul dumneavoastra nu a putut fi gasit");
    error.code = 404;
    return next(error);
  }

  // if the action was not requested by the owner of the account
  if (existingAccount.accountOwner.toString() !== requestingUser) {
    const error = new Error("Nu aveti permisiunea sa accesati acest cont");
    error.code = 401;
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    const { accountOwner } = await existingAccount
      .populate("accountOwner")
      .execPopulate();
    // console.log(accountOwner);
    accountOwner.userAccounts.pull(accountId);
    await accountOwner.save({ session: sess });
    await existingAccount.remove({ session: sess });

    sess.commitTransaction();
  } catch (err) {
    console.log(err);

    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }

  res.status(200).json({ message: "account deleted" });
};

// DEPOSIT
const deposit = async (req, res, next) => {
  const accountId = req.params.id;
  const requestingUser = req.userData.userId;

  // find the account in the data base
  let existingAccount;
  try {
    existingAccount = await Account.findById(accountId);
  } catch (err) {
    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }

  // if no existing account has been found -> send error
  if (!existingAccount) {
    const error = new Error("Contul dumneavoastra nu a putut fi gasit");
    error.code = 404;
    return next(error);
  }

  // if the action was not requested by the owner of the account
  if (existingAccount.accountOwner.toString() !== requestingUser) {
    const error = new Error("Nu aveti permisiunea sa accesati acest cont");
    error.code = 401;
    return next(error);
  }

  const { depositAmount } = req.body;
  existingAccount.accountDeposit += +depositAmount;

  try {
    await existingAccount.save();
  } catch (err) {
    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    // console.log(err);
    error.code = 500;
    return next(error);
  }

  return res.json({ message: "Contul a fost alimentat" });
};

// WITHDRAW
const withdraw = async (req, res, next) => {
  const accountId = req.params.id;
  const requestingUser = req.userData.userId;

  // find the account in the data base
  let existingAccount;
  try {
    existingAccount = await Account.findById(accountId);
  } catch (err) {
    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }

  // if no existing account has been found -> send error
  if (!existingAccount) {
    const error = new Error("Contul dumneavoastra nu a putut fi gasit");
    error.code = 404;
    return next(error);
  }

  // if the action was not requested by the owner of the account
  if (existingAccount.accountOwner.toString() !== requestingUser) {
    const error = new Error("Nu aveti permisiunea sa accesati acest cont");
    error.code = 401;
    return next(error);
  }

  // if withdraawAmount is greater than the account deposit
  const { withdrawAmount } = req.body;
  if (withdrawAmount > existingAccount.accountDeposit) {
    const error = new Error("Fonduri insuficiente");
    error.code = 401;
    return next(error);
  } else existingAccount.accountDeposit -= withdrawAmount; //substract the withdrawnAmount from the accountDeposit

  try {
    await existingAccount.save();
  } catch (err) {
    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    // console.log(err);
    error.code = 500;
    return next(error);
  }

  return res.json({ message: "Tranzactie efectuata" });
};

module.exports = {
  getAccountInfo,
  createAccount,
  deleteAccount,
  deposit,
  withdraw,
};
