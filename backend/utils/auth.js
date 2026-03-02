const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const SECRET = process.env.ADMIN_PASS || "admin123";

function generateToken(username) {
  return jwt.sign({ username }, SECRET, { expiresIn: "8h" });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { generateToken, verifyToken };