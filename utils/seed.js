/**
 * Bootstraps the database with a first admin account (from .env) and a
 * couple of sample classes, so the app is usable immediately after setup.
 *
 * Run with: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const ClassRoom = require("../models/ClassRoom");

async function seed() {
  await connectDB();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@neemazipporah.ac.ke";
  const adminName = process.env.SEED_ADMIN_NAME || "School Administrator";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log(`Admin account already exists: ${adminEmail}`);
  } else {
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
    });
    console.log(`Created admin account: ${adminEmail} (password: ${adminPassword})`);
  }

  const sampleClasses = [
    { name: "Playgroup", gradeLevel: "Playgroup" },
    { name: "PP1", gradeLevel: "PP1" },
    { name: "PP2", gradeLevel: "PP2" },
    { name: "Grade 1", gradeLevel: "Grade 1" },
    { name: "Grade 2", gradeLevel: "Grade 2" },
    { name: "Grade 3", gradeLevel: "Grade 3" },
    { name: "Grade 4", gradeLevel: "Grade 4" },
    { name: "Grade 5", gradeLevel: "Grade 5" },
    { name: "Grade 6", gradeLevel: "Grade 6" },
  ];

  for (const classData of sampleClasses) {
    const exists = await ClassRoom.findOne({
      gradeLevel: classData.gradeLevel,
      stream: "",
      academicYear: String(new Date().getFullYear()),
    });
    if (!exists) {
      await ClassRoom.create(classData);
      console.log(`Created class: ${classData.name}`);
    }
  }

  console.log("Seeding complete.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
