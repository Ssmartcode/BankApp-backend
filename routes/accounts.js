const express = require("express");

const {
  getAccountInfo,
  createAccount,
  deposit,
  withdraw,
  deleteAccount,
  transfer,
  generateTransactionsPDF,
} = require("../controllers/accounts-controller");

const router = express.Router();

// token needed to acces the routes below
router.use(require("../config/auth-jwt"));

router.get("/:id", getAccountInfo);
router.post("/", createAccount);

// check if user account is in db
// check if that account belongs to the user that made the transaction
const checkUserAccount = require("../middleware/checkUserAccount");

router.post("/deposit/:id", checkUserAccount, deposit);
router.post("/withdraw/:id", checkUserAccount, withdraw);
router.post("/transfer/:id", checkUserAccount, transfer);
router.delete("/delete/:id", checkUserAccount, deleteAccount);
router.get("/getTransactions/:id", generateTransactionsPDF);

module.exports = router;
