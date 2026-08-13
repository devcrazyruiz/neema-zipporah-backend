const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");

// @desc    Register a new admin account (public - first-time school setup /
//          adding an additional admin)
// @route   POST /api/auth/admin-signup
// @access  Public
const adminSignup = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  if (password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: "admin",
  });

  const token = generateToken(admin);

  sendEmail({
    to: admin.email,
    subject: "Welcome to Neema Zipporah Academy Admin Portal",
    html: `<p>Hi ${admin.name},</p><p>Your admin account has been created successfully.</p>`,
  });

  res.status(201).json({
    success: true,
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

// @desc    Create a portal account for staff/parents (Teacher, Parent,
//          Accountant). Typically invoked by an admin.
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Please provide name, email, password, and role");
  }

  if (!User.ROLES.includes(role)) {
    res.status(400);
    throw new Error(`Role must be one of: ${User.ROLES.join(", ")}`);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, password, role, phone });

  res.status(201).json({
    success: true,
    user,
  });
});

// @desc    Log in and receive a JWT. The frontend login form lets the user
//          pick which portal (role tab) they're signing in to; we validate
//          that the account actually has that role.
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated. Contact the school administrator.");
  }

  // Role tab was supplied - enforce it matches the account's actual role
  const normalizedRole = role ? String(role).toLowerCase() : null;
  if (normalizedRole && normalizedRole !== user.role) {
    res.status(401);
    throw new Error(`This account is not registered as ${role}`);
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = generateToken(user);

  res.json({
    success: true,
    token,
    user,
  });
});

// @desc    Get the currently authenticated user's profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = { adminSignup, registerUser, loginUser, getMe };
