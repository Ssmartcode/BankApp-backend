const express = require("express");

const {
  getAccountInfo,
  createAccount,
  deposit,
  withdraw,
  deleteAccount,
} = require("../controllers/accounts-controller");

const router = express.Router();

// token needed to acces the routes below
router.use(require("../config/auth-jwt"));

router.get("/:id", getAccountInfo);
router.post("/", createAccount);
router.post("/deposit/:id", deposit);
router.post("/withdraw/:id", withdraw);
router.delete("/delete/:id", deleteAccount);

module.exports = router;
