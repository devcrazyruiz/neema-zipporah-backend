const jwt = require("jsonwebtoken");

/**
 * Sign a JWT for a given user.
 * @param {import("mongoose").Document} user
 * @returns {string}
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

module.exports = generateToken;
