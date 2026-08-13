const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeeInvoice",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    phoneNumber: {
      // normalized 2547XXXXXXXX
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    method: {
      type: String,
      enum: ["mpesa", "cash", "bank"],
      default: "mpesa",
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
    },
    // --- M-Pesa Daraja STK Push fields ---
    merchantRequestId: { type: String },
    checkoutRequestId: { type: String, index: true },
    mpesaReceiptNumber: { type: String },
    resultCode: { type: Number },
    resultDesc: { type: String },
    rawCallback: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
