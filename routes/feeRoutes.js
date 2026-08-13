const express = require("express");
const { getInvoices, createInvoice, getInvoiceById } = require("../controllers/feeController");
const { initiateStkPush, mpesaCallback, getPaymentStatus } = require("../controllers/mpesaController");
const verifyToken = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

// M-Pesa callback must stay public - Safaricom's servers call this
// directly and cannot send our JWT.
router.post("/mpesa/callback", mpesaCallback);

router.use(verifyToken);

router
  .route("/invoices")
  .get(checkRole("admin", "accountant", "parent"), getInvoices)
  .post(checkRole("admin", "accountant"), createInvoice);

router.get("/invoices/:id", checkRole("admin", "accountant", "parent"), getInvoiceById);

router.post("/mpesa/stkpush", checkRole("admin", "accountant", "parent"), initiateStkPush);
router.get("/mpesa/status/:paymentId", checkRole("admin", "accountant", "parent"), getPaymentStatus);

module.exports = router;
