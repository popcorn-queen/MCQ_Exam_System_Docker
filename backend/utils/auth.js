const jwt = require("jsonwebtoken");
const SECRET = process.env.ADMIN_PASS || "admin123";

function generateToken(username) {
  return jwt.sign({ username }, SECRET, { expiresIn: "8h" });
}

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: "No token" });
  try {
    jwt.verify(auth.split(" ")[1], SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

module.exports = { generateToken, verifyToken };