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
router.post("/config", verifyToken, async (req, res) => {
  const { config } = req.body;
  await pool.query(
    "INSERT INTO exam_config(config_json, is_active) VALUES($1, false) RETURNING *",
    [JSON.stringify(config)]  // ← stringify the whole object
  );
  res.json({ message: "Config saved" });
});

// Activate exam
router.post("/activate", verifyToken, async (req, res) => {
  const { examId } = req.body;
  await pool.query("UPDATE exam_config SET is_active = false");
  await pool.query("UPDATE exam_config SET is_active = true WHERE id=$1", [examId]);
  res.json({ message: "Exam activated" });
});

// Get results
router.get("/results", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT * FROM student_attempts");
  res.json(result.rows);
});

// Export CSV
router.get("/export", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT * FROM student_attempts");
  let csv = "roll_number,class,section,score,max_score,percentage,submitted_at\n";
  result.rows.forEach(r => {
    csv += `${r.roll_number},${r.class},${r.section},${r.score},${r.max_score},${r.percentage},${r.submitted_at}\n`;
  });
  res.setHeader("Content-Type", "text/csv");
  res.send(csv);
});

router.get("/configs", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT id, is_active, config_json FROM exam_config");
  res.json(result.rows);
});

router.post("/seed", async (req, res) => {
  const fs = require("fs");
  const questions = JSON.parse(fs.readFileSync("/app/questions.json"));
  await pool.query(
    "INSERT INTO exam_config(config_json, is_active) VALUES($1, false)",
    [JSON.stringify({ duration: 30, questions: questions.questions })]
  );
  res.json({ message: "Seeded!" });
});

module.exports = router;