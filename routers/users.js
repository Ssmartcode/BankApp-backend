const express = require("express");

const router = express.Router();

//
router.get("/", (req, res, next) => {
  res.json({ message: "You have reached users route" });
});

// CONTROLLERS
const { newUser } = require("../controllers/users-controller");

router.post("/", newUser);
module.exports = router;
