const mongoose = require("mongoose");

const GRADE_LEVELS = [
  "Playgroup",
  "PP1",
  "PP2",
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
];

const classRoomSchema = new mongoose.Schema(
  {
    name: {
      // e.g. "Grade 4 Blue"
      type: String,
      required: true,
      trim: true,
    },
    gradeLevel: {
      type: String,
      enum: GRADE_LEVELS,
      required: true,
    },
    stream: {
      // e.g. "Blue", "Red" - optional for single-stream levels
      type: String,
      trim: true,
      default: "",
    },
    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    academicYear: {
      type: String, // e.g. "2026"
      required: true,
      default: () => String(new Date().getFullYear()),
    },
    capacity: {
      type: Number,
      default: 40,
    },
  },
  { timestamps: true }
);

classRoomSchema.index({ gradeLevel: 1, stream: 1, academicYear: 1 }, { unique: true });

classRoomSchema.statics.GRADE_LEVELS = GRADE_LEVELS;

module.exports = mongoose.model("ClassRoom", classRoomSchema);
