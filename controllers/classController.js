const asyncHandler = require("express-async-handler");
const ClassRoom = require("../models/ClassRoom");
const Student = require("../models/Student");

// @desc    List all classes
// @route   GET /api/classes
// @access  Private
const getClasses = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.academicYear) filter.academicYear = req.query.academicYear;

  const classes = await ClassRoom.find(filter)
    .populate("classTeacher", "name email")
    .sort({ gradeLevel: 1, stream: 1 });

  res.json({ success: true, count: classes.length, classes });
});

// @desc    Create a class
// @route   POST /api/classes
// @access  Private/Admin
const createClass = asyncHandler(async (req, res) => {
  const { name, gradeLevel, stream, classTeacher, academicYear, capacity } = req.body;

  if (!name || !gradeLevel) {
    res.status(400);
    throw new Error("name and gradeLevel are required");
  }

  const classRoom = await ClassRoom.create({
    name,
    gradeLevel,
    stream,
    classTeacher,
    academicYear,
    capacity,
  });

  res.status(201).json({ success: true, classRoom });
});

// @desc    Update a class
// @route   PUT /api/classes/:id
// @access  Private/Admin
const updateClass = asyncHandler(async (req, res) => {
  const classRoom = await ClassRoom.findById(req.params.id);

  if (!classRoom) {
    res.status(404);
    throw new Error("Class not found");
  }

  Object.assign(classRoom, req.body);
  await classRoom.save();

  res.json({ success: true, classRoom });
});

// @desc    Delete a class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
const deleteClass = asyncHandler(async (req, res) => {
  const classRoom = await ClassRoom.findById(req.params.id);

  if (!classRoom) {
    res.status(404);
    throw new Error("Class not found");
  }

  const studentCount = await Student.countDocuments({ classRoom: classRoom._id, status: "active" });
  if (studentCount > 0) {
    res.status(400);
    throw new Error("Cannot delete a class that still has active students. Reassign them first.");
  }

  await classRoom.deleteOne();
  res.json({ success: true, message: "Class deleted" });
});

// @desc    Get all students in a class (used by teacher dashboard)
// @route   GET /api/classes/:id/students
// @access  Private/Admin,Teacher
const getClassStudents = asyncHandler(async (req, res) => {
  const students = await Student.find({ classRoom: req.params.id, status: "active" }).sort({
    lastName: 1,
    firstName: 1,
  });

  res.json({ success: true, count: students.length, students });
});

module.exports = {
  getClasses,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
};
