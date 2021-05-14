const express = require("express");

const router = express.Router();

//
router.get("/", (req, res, next) => {
  res.json({ message: "You have reached users route" });
});

// CONTROLLERS
const { newUser, login } = require("../controllers/users-controller");

router.post("/signup", newUser);
router.post("/login", login);
module.exports = router;
