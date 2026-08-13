const mongoose = require("mongoose");

const feeInvoiceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    term: {
      type: String, // e.g. "Term 1"
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      default: () => String(new Date().getFullYear()),
    },
    items: [
      {
        description: { type: String, required: true, trim: true }, // e.g. "Tuition", "Transport"
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["unpaid", "partial", "paid", "overdue"],
      default: "unpaid",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

feeInvoiceSchema.virtual("balance").get(function balance() {
  return Math.max(this.totalAmount - this.amountPaid, 0);
});

feeInvoiceSchema.set("toJSON", { virtuals: true });
feeInvoiceSchema.set("toObject", { virtuals: true });

feeInvoiceSchema.methods.recalculateStatus = function recalculateStatus() {
  if (this.amountPaid <= 0) {
    this.status = this.dueDate && this.dueDate < new Date() ? "overdue" : "unpaid";
  } else if (this.amountPaid < this.totalAmount) {
    this.status = "partial";
  } else {
    this.status = "paid";
  }
};

feeInvoiceSchema.index({ student: 1, term: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("FeeInvoice", feeInvoiceSchema);
