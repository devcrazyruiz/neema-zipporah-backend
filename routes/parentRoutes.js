const express = require("express");
const { getParentDashboard } = require("../controllers/parentController");
const verifyToken = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

router.use(verifyToken);
router.use(checkRole("parent", "admin"));

router.get("/dashboard", getParentDashboard);

module.exports = router;
