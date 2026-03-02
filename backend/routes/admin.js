const express = require("express");
const pool = require("../db/db");
const { generateToken, verifyToken } = require("../utils/auth");

const router = express.Router();

// Admin login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = generateToken(username);
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// Update exam config
router.post("/config", async (req, res) => {
  const { config } = req.body;
  await pool.query("INSERT INTO exam_config(config_json, is_active) VALUES($1, false) RETURNING *", [config]);
  res.json({ message: "Config saved" });
});

// Activate exam
router.post("/activate", async (req, res) => {
  const { examId } = req.body;
  await pool.query("UPDATE exam_config SET is_active = false"); // deactivate others
  await pool.query("UPDATE exam_config SET is_active = true WHERE id=$1", [examId]);
  res.json({ message: "Exam activated" });
});

// Get results
router.get("/results", async (req, res) => {
  const result = await pool.query("SELECT * FROM student_attempts");
  res.json(result.rows);
});

// Export CSV
router.get("/export", async (req, res) => {
  const result = await pool.query("SELECT * FROM student_attempts");
  let csv = "roll_number,class,section,score,max_score,percentage,submitted_at\n";
  result.rows.forEach(r => {
    csv += `${r.roll_number},${r.class},${r.section},${r.score},${r.max_score},${r.percentage},${r.submitted_at}\n`;
  });
  res.setHeader("Content-Type", "text/csv");
  res.send(csv);
});

module.exports = router;