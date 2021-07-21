const express = require("express");
// config
const upload = require("../config/multer-config");

const router = express.Router();
// CONTROLLERS
const {
  newUser,
  login,
  initialization,
  getUserData,
} = require("../controllers/users-controller");
// Validators
const {
  signUpValidator,
  logInValidator,
  initializationValidator,
} = require("../utilities/validators");

router.post("/signup", signUpValidator, newUser);
router.post("/login", logInValidator, login);

// token needed to acces the routes below
router.use(require("../config/auth-jwt"));

router.get("/:id", getUserData);
router.post(
  "/initialization/:random",
  upload.single("image"),
  initializationValidator,
  initialization
);

module.exports = router;
