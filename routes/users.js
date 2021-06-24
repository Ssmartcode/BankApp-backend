const express = require("express");
const multer = require("multer");
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

router.post("/signup", newUser);
router.post("/login", login);

// token needed to acces the routes below
router.use(require("../config/auth-jwt"));

router.get("/:id", getUserData);
router.post("/initialization", upload.single("image"), initialization);

module.exports = router;
