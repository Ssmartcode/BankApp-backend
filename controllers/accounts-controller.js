const mongoose = require("mongoose");
const { findByIdAndDelete } = require("../models/accounts");

// utilities
const generateIBAN = require("../utilities/generateIBAN");
// models
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

  // generate new IBAN
  const accountIBAN = generateIBAN();

  // add to the account history the creation date
  const transactionsHistory = {
    type: "created",
    timeStamp: new Date(),
  };

  // create new account
  const userAccount = new Account({
    accountType,
    accountCurrency,
    accountDeposit: 0,
    accountIBAN,
    transactionsHistory,
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

// !REDUCE THE CODE BY MAKING ONE FUNCTION FOR THE PART WHERE YOU SEARCH IF THE ACCOUNT IS FOUND --------------------

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
  const transactionHistory = {
    type: "deposit",
    depositAmount,
    timeStamp: new Date(),
  };
  existingAccount.transactionsHistory.push(transactionHistory);
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
  }

  const transactionHistory = {
    type: "withdraw",
    withdrawAmount,
    timeStamp: new Date(),
  };
  existingAccount.accountDeposit -= withdrawAmount; //substract the withdrawnAmount from the accountDeposit
  existingAccount.transactionsHistory.push(transactionHistory);

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

// TRANSFER
const transfer = async (req, res, next) => {
  const requestingUser = req.userData.userId;
  const { accountId, transferAmount, destinationIBAN } = req.body;

  // find the sender account
  let senderAccount;
  try {
    senderAccount = await Account.findById(accountId);
  } catch (err) {
    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }
  // if no existing account has been found -> send error
  if (!senderAccount) {
    const error = new Error("Contul dumneavoastra nu a putut fi gasit");
    error.code = 404;
    return next(error);
  }
  // if the action was not requested by the owner of the account
  if (senderAccount.accountOwner.toString() !== requestingUser) {
    const error = new Error("Nu aveti permisiunea sa accesati acest cont");
    error.code = 401;
    return next(error);
  }

  // find the receiver account
  let recieverAccount;
  try {
    recieverAccount = await Account.findOne({
      accountIBAN: destinationIBAN,
    });
  } catch (err) {
    console.log(err);
  }
  // if no existing account has been found -> send error
  if (!recieverAccount) {
    const error = new Error("Contul destinatar nu a putut fi gasit");
    error.code = 404;
    return next(error);
  }

  // send error if the transfer amount exceeds the current depsoit in the senderAccount
  if (transferAmount > senderAccount.accountDeposit) {
    const error = new Error("Fonduri insuficiente");
    error.code = 401;
    return next(error);
  }

  const transactionHistory = {
    type: "transfer",
    transferAmount,
    senderIBAN: senderAccount.accountIBAN,
    destinationIBAN,
    timeStamp: new Date(),
  };
  // add the amount to the reciever and retrieve it from the sender
  // add an object to account transactionHistory proprety containng informations about transaction
  senderAccount.accountDeposit -= +transferAmount;
  recieverAccount.accountDeposit += +transferAmount;
  senderAccount.transactionsHistory.push(transactionHistory);
  recieverAccount.transactionsHistory.push(transactionHistory);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    transactionHistory.transferType = "send";
    await senderAccount.save({ session: sess });
    transactionHistory.transferType = "recieve";
    await recieverAccount.save({ session: sess });

    sess.commitTransaction();
  } catch (err) {
    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
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
  transfer,
};
