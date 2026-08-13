const express = require("express");
const {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
} = require("../controllers/classController");
const verifyToken = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

router.use(verifyToken);

router
  .route("/")
  .get(checkRole("admin", "teacher", "accountant"), getClasses)
  .post(checkRole("admin"), createClass);

router
  .route("/:id")
  .put(checkRole("admin"), updateClass)
  .delete(checkRole("admin"), deleteClass);

router.get("/:id/students", checkRole("admin", "teacher"), getClassStudents);

module.exports = router;
