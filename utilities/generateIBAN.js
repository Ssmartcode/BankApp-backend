const Account = require("../models/accounts");
function generateRandom(min, max, n) {
  if (n === 0) return "";
  random = Math.floor(Math.random() * (max - min + 1) + min);
  return random.toString() + generateRandom(min, max, n - 1);
}

const generateIBAN = () => {
  const ISO_COUNTRY_CODE = "RO";
  let ibanCheckDigits;
  const BANK_IDENTIFIER = "RZVB";
  let accountNumber;

  // generate check digits
  ibanCheckDigits = generateRandom(10, 99, 1);

  // generate account number
  accountNumber = generateRandom(1000, 9999, 4);

  return ISO_COUNTRY_CODE + ibanCheckDigits + BANK_IDENTIFIER + accountNumber;
};

const generateUniqueIBAN = async () => {
  let uniqueIBAN;
  while (!uniqueIBAN) {
    const IBAN = generateIBAN();
    const exists = await Account.findOne({ accountIban: IBAN });
    if (!exists) uniqueIBAN = IBAN;
  }
};
module.exports = generateIBAN;
