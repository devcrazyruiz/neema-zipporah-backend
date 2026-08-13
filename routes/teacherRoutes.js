const express = require("express");
const {
  getTeacherDashboard,
  getMyClassStudents,
  submitAttendance,
  getAttendanceHistory,
} = require("../controllers/teacherController");
const verifyToken = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

router.use(verifyToken);
router.use(checkRole("teacher", "admin"));

router.get("/dashboard", getTeacherDashboard);
router.get("/classes/:classId/students", getMyClassStudents);
router.post("/attendance", submitAttendance);
router.get("/attendance/:classId", getAttendanceHistory);

module.exports = router;
