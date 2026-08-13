const asyncHandler = require("express-async-handler");
const FeeInvoice = require("../models/FeeInvoice");
const Student = require("../models/Student");

// @desc    List invoices (filter by student, status, term/year)
// @route   GET /api/fees/invoices?student=&status=&term=&academicYear=
// @access  Private/Admin,Accountant,Parent(own children)
const getInvoices = asyncHandler(async (req, res) => {
  const { student, status, term, academicYear } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (term) filter.term = term;
  if (academicYear) filter.academicYear = academicYear;

  if (req.user.role === "parent") {
    const myChildren = (req.user.children || []).map((c) => c.toString());
    if (student && !myChildren.includes(student)) {
      res.status(403);
      throw new Error("You can only view invoices for your own children");
    }
    filter.student = student ? student : { $in: myChildren };
  } else if (student) {
    filter.student = student;
  }

  const invoices = await FeeInvoice.find(filter)
    .populate("student", "firstName lastName admissionNumber")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: invoices.length, invoices });
});

// @desc    Create a fee invoice for a student
// @route   POST /api/fees/invoices
// @access  Private/Admin,Accountant
const createInvoice = asyncHandler(async (req, res) => {
  const { student, term, academicYear, items, dueDate } = req.body;

  if (!student || !term || !Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("student, term, and a non-empty items array are required");
  }

  const studentExists = await Student.findById(student);
  if (!studentExists) {
    res.status(400);
    throw new Error("Student not found");
  }

  const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const invoice = await FeeInvoice.create({
    student,
    term,
    academicYear,
    items,
    totalAmount,
    dueDate,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, invoice });
});

// @desc    Get one invoice
// @route   GET /api/fees/invoices/:id
// @access  Private/Admin,Accountant,Parent(own child)
const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await FeeInvoice.findById(req.params.id).populate(
    "student",
    "firstName lastName admissionNumber guardians"
  );

  if (!invoice) {
    res.status(404);
    throw new Error("Invoice not found");
  }

  if (req.user.role === "parent") {
    const myChildren = (req.user.children || []).map((c) => c.toString());
    if (!myChildren.includes(invoice.student._id.toString())) {
      res.status(403);
      throw new Error("You do not have access to this invoice");
    }
  }

  res.json({ success: true, invoice });
});

module.exports = { getInvoices, createInvoice, getInvoiceById };
