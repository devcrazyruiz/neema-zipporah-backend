const express = require("express");
const {
  getStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
} = require("../controllers/staffController");
const verifyToken = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

router.use(verifyToken);
router.use(checkRole("admin"));

router.route("/").get(getStaff).post(createStaff);

router.route("/:id").get(getStaffById).put(updateStaff).delete(deleteStaff);

module.exports = router;
