const mongoose = require("mongoose");

// ! unique might brake the account initiation when you upload an image for second time
const UserSchema = mongoose.Schema({
  fullName: { type: String, require: false },
  userName: { type: String, require: true },
  userEmail: { type: String, require: true }, //!make this unique
  userAge: { type: Number, required: true },
  userPassword: { type: String, require: true },
  userPhone: { type: String, require: false },
  userAccounts: [{ type: mongoose.Types.ObjectId, ref: "Account" }],
  userAccountsLimit: { type: Number, require: true },
  userImage: { type: String, require: false },
  isInitialized: { type: Boolean, require: true },
});

module.exports = mongoose.model("User", UserSchema);
