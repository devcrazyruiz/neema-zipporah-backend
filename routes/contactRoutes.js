const express = require("express");
const { submitContact, getContacts } = require("../controllers/contactController");
const verifyToken = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

router.post("/", submitContact);
router.get("/", verifyToken, checkRole("admin"), getContacts);

module.exports = router;