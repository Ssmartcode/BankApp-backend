const { body } = require("express-validator");
const signUpValidator = [
  body("userName").isLength({ min: 3 }),
  body("userEmail").isEmail(),
  body("userPassword").isLength({ min: 8 }),
  body("userAge").custom((val) => val > 17),
];
const logInValidator = [
  body("userName").isLength({ min: 3 }),
  body("userPassword").isLength({ min: 8 }),
];

const types = ["standard", "business"];
const currencies = ["RON", "EUR", "USD"];
const initializationValidator = [
  body("userPhone").custom((val) => {
    return ("" + val).length === 10;
  }),
  body("fullName").isLength({ min: 3 }),
  body("accountType").custom((val) => {
    return types.find((type) => type === val);
  }),
  body("accountCurrency").custom((val) => {
    return currencies.find((curr) => curr === val);
  }),
];

module.exports = {
  signUpValidator,
  logInValidator,
  initializationValidator,
};
