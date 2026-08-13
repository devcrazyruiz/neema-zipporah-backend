const express = require("express");
const router = express.Router();

const { getAccountantDashboard } = require("../controllers/accountantController");
const verifyToken = require("../middleware/auth");

const requireAccountant = (req, res, next) => {
  if (!["accountant", "admin"].includes(req.user.role)) {
    res.status(403);
    return next(new Error("Not authorized to view accountant dashboard."));
  }
  next();
};

router.get("/dashboard", verifyToken, requireAccountant, getAccountantDashboard);

module.exports = router;