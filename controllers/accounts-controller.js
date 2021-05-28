const mongoose = require("mongoose");
const { findByIdAndDelete } = require("../models/accounts");
const convert = require("../utilities/convert");
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

// DELETE
const deleteAccount = async (req, res, next) => {
  const existingAccount = req.existingAccount;
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
  const existingAccount = req.existingAccount;

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
    console.log(err);
    const error = new Error("Ceva nu a mers bine. Va rog incercati mai tarziu");
    error.code = 500;
    return next(error);
  }

  return res.json({ message: "Contul a fost alimentat" });
};

// WITHDRAW
const withdraw = async (req, res, next) => {
  const existingAccount = req.existingAccount;
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
  const senderAccount = req.existingAccount;
  let { transferAmount, destinationIBAN } = req.body;

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

  // send error if the transfer amount exceeds the current deposit in the senderAccount
  if (transferAmount > senderAccount.accountDeposit) {
    const error = new Error("Fonduri insuficiente");
    error.code = 401;
    return next(error);
  }

  // convert the transfetAmount if the accounts' currency is different
  const senderCurrency = senderAccount.accountCurrency;
  const recieverCurrency = recieverAccount.accountCurrency;
  let convertedTransferAmount = 0;
  console.log(recieverCurrency, " ", recieverCurrency);
  if (senderCurrency !== recieverCurrency)
    try {
      convertedTransferAmount = await convert(
        +transferAmount,
        senderCurrency,
        recieverCurrency
      );
    } catch (err) {
      const error = new Error(
        "Ceva nu a mers bine. Va rog incercati mai tarziu"
      );
      console.log(err);
      error.code = 500;
      return next(error);
    }

  // create a record for this tranzaction and add the record to both the sender and reciever
  const senderTransactionHistory = {
    type: "transfer",
    transferType: "send",
    transferAmount: +transferAmount,
    senderIBAN: senderAccount.accountIBAN,
    destinationIBAN,
    timeStamp: new Date(),
  };
  const recieverTransactionHistory = {
    type: "transfer",
    transferType: "recieve",
    transferAmount: convertedTransferAmount || +transferAmount,
    senderIBAN: senderAccount.accountIBAN,
    destinationIBAN,
    timeStamp: new Date(),
  };

  // add the amount to the reciever and retrieve it from the sender
  // add an object to account transactionHistory proprety containng informations about transaction
  senderAccount.accountDeposit -= +transferAmount;
  recieverAccount.accountDeposit += convertedTransferAmount || +transferAmount; //add converted amount if different currency
  senderAccount.transactionsHistory.push(senderTransactionHistory);
  recieverAccount.transactionsHistory.push(recieverTransactionHistory);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await senderAccount.save({ session: sess });
    await recieverAccount.save({ session: sess });

    sess.commitTransaction();
  } catch (err) {
    console.log(err);
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
