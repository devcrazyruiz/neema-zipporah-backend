const express = require("express");
const { adminSignup, registerUser, loginUser, getMe } = require("../controllers/authController");
const verifyToken = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

router.post("/admin-signup", adminSignup);
router.post("/login", loginUser);
router.post("/register", verifyToken, checkRole("admin"), registerUser);
router.get("/me", verifyToken, getMe);

module.exports = router;
