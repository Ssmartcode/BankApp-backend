const mongoose = require("mongoose");

const AccountSchema = mongoose.Schema({
  accountType: { type: String, require: true },
  accountCurrency: { type: String, require: true },
  accountDeposit: { type: Number, require: true },
  transactionsHistory: [{ type: Object, require: true }],
  accountIBAN: { type: String, require: true },
  accountOwner: { type: mongoose.Types.ObjectId, require: true, ref: "User" },
});

module.exports = mongoose.model("Account", AccountSchema);
