const FeeInvoice = require("../models/FeeInvoice");
const Payment = require("../models/Payment");
const Student = require("../models/Student");

// GET /api/accountant/dashboard
exports.getAccountantDashboard = async (req, res, next) => {
  try {
    // "This term" = the most recently created invoice's term/academicYear.
    // Falls back to all invoices if none exist yet.
    const latestInvoice = await FeeInvoice.findOne()
      .sort({ createdAt: -1 })
      .select("term academicYear");

    const invoiceFilter =
      latestInvoice?.term && latestInvoice?.academicYear
        ? { term: latestInvoice.term, academicYear: latestInvoice.academicYear }
        : {};

    const invoices = await FeeInvoice.find(invoiceFilter).populate({
      path: "student",
      select: "admissionNumber firstName lastName classRoom status",
      populate: { path: "classRoom", select: "gradeLevel stream" },
    });

    let totalExpected = 0;
    let totalCollected = 0;
    let totalOutstanding = 0;
    let unpaidCount = 0;
    let paidCount = 0;
    const feeBalances = [];

    for (const inv of invoices) {
      totalExpected += inv.totalAmount;
      totalCollected += inv.amountPaid;

      const balance = Math.max(inv.totalAmount - inv.amountPaid, 0);
      totalOutstanding += balance;

      if (inv.status === "paid") paidCount += 1;
      if (inv.status === "unpaid" || inv.status === "overdue") unpaidCount += 1;

      if (balance > 0 && inv.student) {
        const classRoom = inv.student.classRoom;
        feeBalances.push({
          id: inv._id,
          admissionNumber: inv.student.admissionNumber,
          name: `${inv.student.firstName} ${inv.student.lastName}`,
          classLevel: classRoom
            ? `${classRoom.gradeLevel}${classRoom.stream ? " " + classRoom.stream : ""}`
            : "N/A",
          balance,
          status: inv.status,
        });
      }
    }

    feeBalances.sort((a, b) => b.balance - a.balance);
    const topFeeBalances = feeBalances.slice(0, 10);

    const percentCollected =
      totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

    const totalStudents = await Student.countDocuments({ status: "active" });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysPayments = await Payment.find({
      status: "success",
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const paymentsToday = todaysPayments.length;
    const amountToday = todaysPayments.reduce((sum, p) => sum + p.amount, 0);

    const recentPaymentsRaw = await Payment.find({ status: "success" })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate({ path: "student", select: "firstName lastName" });

    const recentPayments = recentPaymentsRaw.map((p) => ({
      studentName: p.student ? `${p.student.firstName} ${p.student.lastName}` : "Unknown",
      transactionCode: p.mpesaReceiptNumber || p.checkoutRequestId || "-",
      method: p.method,
      amount: p.amount,
      time: p.createdAt.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }),
    }));

    res.json({
      totalCollected,
      percentCollected,
      totalOutstanding,
      unpaidCount,
      paymentsToday,
      amountToday,
      paidCount,
      totalStudents,
      feeBalances: topFeeBalances,
      recentPayments,
    });
  } catch (err) {
    next(err);
  }
};