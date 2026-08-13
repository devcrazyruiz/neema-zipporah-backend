const asyncHandler = require("express-async-handler");
const ClassRoom = require("../models/ClassRoom");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

// @desc    Teacher dashboard summary: assigned classes + student counts +
//          today's attendance status per class
// @route   GET /api/teacher/dashboard
// @access  Private/Teacher
const getTeacherDashboard = asyncHandler(async (req, res) => {
  const classes = await ClassRoom.find({
    $or: [{ classTeacher: req.user._id }, { _id: { $in: req.user.assignedClasses || [] } }],
  }).sort({ gradeLevel: 1 });

  const todayStart = new Date(new Date().toDateString());

  const classSummaries = await Promise.all(
    classes.map(async (classRoom) => {
      const studentCount = await Student.countDocuments({
        classRoom: classRoom._id,
        status: "active",
      });
      const attendanceTaken = await Attendance.exists({
        classRoom: classRoom._id,
        date: todayStart,
      });

      return {
        id: classRoom._id,
        name: classRoom.name,
        gradeLevel: classRoom.gradeLevel,
        stream: classRoom.stream,
        studentCount,
        attendanceTakenToday: Boolean(attendanceTaken),
      };
    })
  );

  res.json({
    success: true,
    teacher: { id: req.user._id, name: req.user.name, subjects: req.user.subjects },
    classes: classSummaries,
  });
});

// @desc    Get roster for a class this teacher can manage (used to build
//          the attendance-taking screen)
// @route   GET /api/teacher/classes/:classId/students
// @access  Private/Teacher
const getMyClassStudents = asyncHandler(async (req, res) => {
  const { classId } = req.params;

  const classRoom = await ClassRoom.findById(classId);
  if (!classRoom) {
    res.status(404);
    throw new Error("Class not found");
  }

  const isAssigned =
    (classRoom.classTeacher && classRoom.classTeacher.toString() === req.user._id.toString()) ||
    (req.user.assignedClasses || []).some((c) => c.toString() === classId);

  if (req.user.role === "teacher" && !isAssigned) {
    res.status(403);
    throw new Error("You are not assigned to this class");
  }

  const students = await Student.find({ classRoom: classId, status: "active" }).sort({
    lastName: 1,
    firstName: 1,
  });

  res.json({ success: true, classRoom: { id: classRoom._id, name: classRoom.name }, students });
});

// @desc    Submit attendance for a class for a given date (upserts the
//          day's sheet so teachers can correct mistakes the same day)
// @route   POST /api/teacher/attendance
// @body    { classRoom, date, records: [{ student, status, remarks }] }
// @access  Private/Teacher
const submitAttendance = asyncHandler(async (req, res) => {
  const { classRoom, date, records } = req.body;

  if (!classRoom || !Array.isArray(records) || records.length === 0) {
    res.status(400);
    throw new Error("classRoom and a non-empty records array are required");
  }

  const attendanceDate = date ? new Date(new Date(date).toDateString()) : new Date(new Date().toDateString());

  const attendance = await Attendance.findOneAndUpdate(
    { classRoom, date: attendanceDate },
    { classRoom, date: attendanceDate, takenBy: req.user._id, records },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(201).json({ success: true, attendance });
});

// @desc    Get attendance history for a class
// @route   GET /api/teacher/attendance/:classId?from=&to=
// @access  Private/Teacher,Admin
const getAttendanceHistory = asyncHandler(async (req, res) => {
  const { classId } = req.params;
  const { from, to } = req.query;

  const filter = { classRoom: classId };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const history = await Attendance.find(filter)
    .populate("records.student", "firstName lastName admissionNumber")
    .sort({ date: -1 });

  res.json({ success: true, count: history.length, history });
});

module.exports = {
  getTeacherDashboard,
  getMyClassStudents,
  submitAttendance,
  getAttendanceHistory,
};
