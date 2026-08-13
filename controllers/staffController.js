const asyncHandler = require("express-async-handler");
const Staff = require("../models/Staff");

// @desc    List staff directory (supports the search/dept/access filters
//          used by the Admin dashboard staff table)
// @route   GET /api/admin/staff?search=&dept=&access=&status=
// @access  Private/Admin
const getStaff = asyncHandler(async (req, res) => {
  const { search, dept, access, status } = req.query;
  const filter = {};

  if (dept && dept !== "all") filter.dept = dept;
  if (access && access !== "all") filter.access = access;
  if (status && status !== "all") filter.status = status;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { role: { $regex: search, $options: "i" } },
    ];
  }

  const staff = await Staff.find(filter).sort({ createdAt: -1 });

  res.json({ success: true, count: staff.length, staff });
});

// @desc    Get one staff record
// @route   GET /api/admin/staff/:id
// @access  Private/Admin
const getStaffById = asyncHandler(async (req, res) => {
  const staffMember = await Staff.findById(req.params.id);

  if (!staffMember) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  res.json({ success: true, staff: staffMember });
});

// @desc    Add a staff member to the directory
// @route   POST /api/admin/staff
// @access  Private/Admin
const createStaff = asyncHandler(async (req, res) => {
  const { name, role, dept, email, phone, access, status } = req.body;

  if (!name || !role || !email) {
    res.status(400);
    throw new Error("name, role, and email are required");
  }

  const existing = await Staff.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("A staff member with this email already exists");
  }

  const staffMember = await Staff.create({
    name,
    role,
    dept,
    email,
    phone,
    access,
    status,
  });

  res.status(201).json({ success: true, staff: staffMember });
});

// @desc    Update a staff member's details
// @route   PUT /api/admin/staff/:id
// @access  Private/Admin
const updateStaff = asyncHandler(async (req, res) => {
  const staffMember = await Staff.findById(req.params.id);

  if (!staffMember) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  Object.assign(staffMember, req.body);
  await staffMember.save();

  res.json({ success: true, staff: staffMember });
});

// @desc    Remove a staff member from the directory
// @route   DELETE /api/admin/staff/:id
// @access  Private/Admin
const deleteStaff = asyncHandler(async (req, res) => {
  const staffMember = await Staff.findById(req.params.id);

  if (!staffMember) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  await staffMember.deleteOne();

  res.json({ success: true, message: "Staff member removed" });
});

module.exports = { getStaff, getStaffById, createStaff, updateStaff, deleteStaff };
