const mongoose = require("mongoose");

// This models the staff directory shown in the Admin dashboard (name, role,
// department, access level, status). It's intentionally separate from the
// `User` login model: not every staff member has portal login access, and
// HR records can exist before an account is created for them.
const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true }, // job title, e.g. "Grade 4 Teacher"
    dept: { type: String, trim: true }, // department, e.g. "Academics", "Finance"
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    access: {
      type: String,
      enum: ["Admin", "Staff", "Viewer"],
      default: "Staff",
    },
    status: {
      type: String,
      enum: ["active", "leave", "inactive"],
      default: "active",
    },
    // Optional link to a portal login account, once one is created
    linkedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
