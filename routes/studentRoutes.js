const express = require("express");
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const verifyToken = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

router.use(verifyToken);

router
  .route("/")
  .get(checkRole("admin", "teacher", "accountant"), getStudents)
  .post(checkRole("admin"), createStudent);

router
  .route("/:id")
  .get(checkRole("admin", "teacher", "accountant", "parent"), getStudentById)
  .put(checkRole("admin"), updateStudent)
  .delete(checkRole("admin"), deleteStudent);

module.exports = router;
