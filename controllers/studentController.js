const asyncHandler = require("express-async-handler");
const Student = require("../models/Student");
const ClassRoom = require("../models/ClassRoom");

// @desc    List students (optionally filter by class/status)
// @route   GET /api/students?classRoom=&status=&search=
// @access  Private/Admin,Teacher,Accountant
const getStudents = asyncHandler(async (req, res) => {
  const { classRoom, status, search } = req.query;
  const filter = {};

  if (classRoom) filter.classRoom = classRoom;
  if (status) filter.status = status;
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { admissionNumber: { $regex: search, $options: "i" } },
    ];
  }

  const students = await Student.find(filter)
    .populate("classRoom", "name gradeLevel stream")
    .sort({ lastName: 1, firstName: 1 });

  res.json({ success: true, count: students.length, students });
});

// @desc    Get a single student by ID
// @route   GET /api/students/:id
// @access  Private/Admin,Teacher,Accountant,Parent(own child)
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate("classRoom", "name gradeLevel stream")
    .populate("guardians.parent", "name email phone");

  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  // Parents may only view their own children
  if (req.user.role === "parent") {
    const isMyChild = student.guardians.some(
      (g) => g.parent && g.parent._id.toString() === req.user._id.toString()
    );
    if (!isMyChild) {
      res.status(403);
      throw new Error("You do not have access to this student's record");
    }
  }

  res.json({ success: true, student });
});

// @desc    Create a new student (admission)
// @route   POST /api/students
// @access  Private/Admin
const createStudent = asyncHandler(async (req, res) => {
  const {
    admissionNumber,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    classRoom,
    guardians,
    address,
    medicalNotes,
    photoUrl,
  } = req.body;

  if (!admissionNumber || !firstName || !lastName || !classRoom) {
    res.status(400);
    throw new Error("admissionNumber, firstName, lastName, and classRoom are required");
  }

  const classExists = await ClassRoom.findById(classRoom);
  if (!classExists) {
    res.status(400);
    throw new Error("The specified class does not exist");
  }

  const student = await Student.create({
    admissionNumber,
    firstName,
    lastName,
    dateOfBirth,
    gender,
    classRoom,
    guardians,
    address,
    medicalNotes,
    photoUrl,
  });

  res.status(201).json({ success: true, student });
});

// @desc    Update a student's details
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  Object.assign(student, req.body);
  await student.save();

  res.json({ success: true, student });
});

// @desc    Remove a student (soft: sets status inactive by default)
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error("Student not found");
  }

  if (req.query.hard === "true") {
    await student.deleteOne();
    return res.json({ success: true, message: "Student permanently deleted" });
  }

  student.status = "inactive";
  await student.save();

  res.json({ success: true, message: "Student marked inactive", student });
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
};
