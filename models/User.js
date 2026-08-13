const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["admin", "teacher", "parent", "accountant"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
      default: "parent",
    },
    phone: {
      type: String,
      trim: true,
    },
    // Set false to disable a user's access without deleting the account
    isActive: {
      type: Boolean,
      default: true,
    },
    // Teacher-specific: classes/subjects assigned
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClassRoom",
      },
    ],
    subjects: [{ type: String, trim: true }],
    // Parent-specific: linked children
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare passwords
userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Never leak password hash, even if accidentally selected
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model("User", userSchema);
