const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  userName: { type: String, require: true },
  userEmail: { type: String, require: true },
  userAge: { type: Number, required: true },
  userPassword: { type: String, require: true },
  isInitialized: { type: Boolean, require: true },
});

module.exports = mongoose.model("User", UserSchema);
