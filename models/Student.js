const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    admissionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Male", "Female"] },
    classRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassRoom",
      required: true,
    },
    guardians: [
      {
        parent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        relationship: {
          type: String,
          enum: ["Mother", "Father", "Guardian"],
          default: "Guardian",
        },
        isPrimaryContact: { type: Boolean, default: false },
      },
    ],
    address: { type: String, trim: true },
    medicalNotes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated", "transferred"],
      default: "active",
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    photoUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

studentSchema.virtual("fullName").get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

studentSchema.set("toJSON", { virtuals: true });
studentSchema.set("toObject", { virtuals: true });

studentSchema.index({ classRoom: 1, status: 1 });

module.exports = mongoose.model("Student", studentSchema);
