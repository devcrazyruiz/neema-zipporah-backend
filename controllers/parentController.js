const asyncHandler = require("express-async-handler");
const Student = require("../models/Student");
const FeeInvoice = require("../models/FeeInvoice");

// @desc    Parent dashboard: linked children plus each child's outstanding
//          fee balance, for the parent portal landing page.
// @route   GET /api/parent/dashboard
// @access  Private/Parent
const getParentDashboard = asyncHandler(async (req, res) => {
  const children = await Student.find({ _id: { $in: req.user.children || [] } }).populate(
    "classRoom",
    "name gradeLevel stream"
  );

  const childSummaries = await Promise.all(
    children.map(async (child) => {
      const invoices = await FeeInvoice.find({ student: child._id }).sort({ createdAt: -1 });
      const outstandingBalance = invoices.reduce((sum, inv) => sum + inv.balance, 0);

      return {
        id: child._id,
        fullName: child.fullName,
        admissionNumber: child.admissionNumber,
        classRoom: child.classRoom,
        outstandingBalance,
        invoiceCount: invoices.length,
      };
    })
  );

  res.json({ success: true, parent: { id: req.user._id, name: req.user.name }, children: childSummaries });
});

module.exports = { getParentDashboard };
