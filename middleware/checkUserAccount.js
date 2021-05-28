const Account = require("../models/accounts");

const checkUserAccount = async (req, res, next) => {
  const accountId = req.params.id;
  console.log(accountId);
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

  req.existingAccount = existingAccount;
  next();
};

module.exports = checkUserAccount;
