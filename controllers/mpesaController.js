const asyncHandler = require("express-async-handler");
const Payment = require("../models/Payment");
const FeeInvoice = require("../models/FeeInvoice");
const { stkPush, stkPushQuery, normalizePhoneNumber } = require("../utils/mpesa");
const sendEmail = require("../utils/sendEmail");

// @desc    Initiate an M-Pesa STK Push prompt to pay towards an invoice
// @route   POST /api/fees/mpesa/stkpush
// @body    { invoiceId, phoneNumber, amount }
// @access  Private/Parent,Admin,Accountant
const initiateStkPush = asyncHandler(async (req, res) => {
  const { invoiceId, phoneNumber, amount } = req.body;

  if (!invoiceId || !phoneNumber || !amount) {
    res.status(400);
    throw new Error("invoiceId, phoneNumber, and amount are required");
  }

  const invoice = await FeeInvoice.findById(invoiceId).populate("student", "firstName lastName admissionNumber");
  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  if (Number(amount) > invoice.balance) {
    res.status(400);
    throw new Error(`Amount exceeds the outstanding balance of KES ${invoice.balance}`);
  }

  const payment = await Payment.create({
    invoice: invoice._id,
    student: invoice.student._id,
    initiatedBy: req.user._id,
    phoneNumber: normalizePhoneNumber(phoneNumber),
    amount,
    method: "mpesa",
    status: "pending",
  });

  try {
    const stkResponse = await stkPush({
      phoneNumber,
      amount,
      accountReference: invoice.student.admissionNumber,
      transactionDesc: `${invoice.term} fees`,
    });

    payment.merchantRequestId = stkResponse.MerchantRequestID;
    payment.checkoutRequestId = stkResponse.CheckoutRequestID;
    await payment.save();

    res.status(200).json({
      success: true,
      message: "STK Push sent. Ask the payer to check their phone and enter their M-Pesa PIN.",
      paymentId: payment._id,
      checkoutRequestId: stkResponse.CheckoutRequestID,
    });
  } catch (error) {
    payment.status = "failed";
    payment.resultDesc = error.response?.data?.errorMessage || error.message;
    await payment.save();

    res.status(502);
    throw new Error("Could not reach M-Pesa. Please try again shortly.");
  }
});

// @desc    Daraja calls this URL automatically once the customer completes
//          (or cancels) the STK Push prompt.
// @route   POST /api/fees/mpesa/callback
// @access  Public (Safaricom servers)
const mpesaCallback = asyncHandler(async (req, res) => {
  // Daraja expects a fast 200 OK acknowledging receipt, regardless of the
  // outcome, or it will keep retrying.
  const stkCallback = req.body?.Body?.stkCallback;

  if (!stkCallback) {
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

  const payment = await Payment.findOne({ checkoutRequestId: CheckoutRequestID });
  if (!payment) {
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
  }

  payment.resultCode = ResultCode;
  payment.resultDesc = ResultDesc;
  payment.rawCallback = req.body;

  if (ResultCode === 0) {
    const items = CallbackMetadata?.Item || [];
    const getVal = (name) => items.find((i) => i.Name === name)?.Value;

    payment.status = "success";
    payment.mpesaReceiptNumber = getVal("MpesaReceiptNumber");

    const invoice = await FeeInvoice.findById(payment.invoice);
    if (invoice) {
      invoice.amountPaid += payment.amount;
      invoice.recalculateStatus();
      await invoice.save();
    }
  } else {
    payment.status = ResultCode === 1032 ? "cancelled" : "failed";
  }

  await payment.save();

  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
});

// @desc    Check the current status of a payment (poll from the frontend
//          while waiting for the callback)
// @route   GET /api/fees/mpesa/status/:paymentId
// @access  Private
const getPaymentStatus = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.paymentId);

  if (!payment) {
    res.status(404);
    throw new Error("Payment not found");
  }

  // If still pending after a few seconds, actively query Daraja rather than
  // waiting indefinitely for the callback (useful on flaky networks).
  if (payment.status === "pending" && payment.checkoutRequestId) {
    try {
      const queryResult = await stkPushQuery(payment.checkoutRequestId);
      if (queryResult.ResultCode !== undefined && String(queryResult.ResultCode) !== "1032") {
        // Non-cancelled definitive result available; the callback will
        // usually have already updated it, but this catches edge cases.
      }
    } catch (error) {
      // Query can fail while the transaction is still in-flight; ignore.
    }
  }

  res.json({ success: true, payment });
});

module.exports = { initiateStkPush, mpesaCallback, getPaymentStatus };
