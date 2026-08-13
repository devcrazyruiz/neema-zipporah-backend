const mongoose = require("mongoose");

const attendanceRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
      default: "present",
    },
    remarks: { type: String, trim: true },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    classRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassRoom",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(new Date().toDateString()),
    },
    takenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    records: [attendanceRecordSchema],
  },
  { timestamps: true }
);

// One attendance sheet per class per calendar day
attendanceSchema.index({ classRoom: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
