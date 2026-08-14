require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const nodemailer = require("nodemailer");

const connectDB = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const classRoutes = require("./routes/classRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const parentRoutes = require("./routes/parentRoutes");
const feeRoutes = require("./routes/feeRoutes");
const staffRoutes = require("./routes/staffRoutes");

const contactRoutes = require("./routes/contactRoutes");
const accountantRoutes = require("./routes/accountantRoutes");

connectDB();

const app = express();


app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://neema-zipporah.vercel.app/",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Neema Zipporah Academy API is running",
    timestamp: new Date().toISOString(),
  });
});
app.get("/api/health", (req, res) => res.json({ success: true, status: "ok" }));


app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/admin/staff", staffRoutes);
app.use("/api/accountant", accountantRoutes);
app.use("/api/contact", contactRoutes);


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});


process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
});

module.exports = app;