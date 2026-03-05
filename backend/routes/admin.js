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

// Upload questions (replaces all existing questions)
router.post("/upload-questions", verifyToken, async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0)
    return res.status(400).json({ message: "Invalid questions format" });

  // Validate each question has required fields
  for (const q of questions) {
    if (!q.question || !q.type || !q.options || !q.correctAnswer)
      return res.status(400).json({ message: `Invalid question: ${JSON.stringify(q)}` });
  }

  // Replace all questions
  await pool.query("DELETE FROM questions");
  for (const q of questions) {
    await pool.query("INSERT INTO questions(question_data) VALUES($1)", [JSON.stringify(q)]);
  }

  res.json({ message: `${questions.length} questions uploaded successfully` });
});

// Get all uploaded questions (for preview in dashboard)
router.get("/questions", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT id, question_data FROM questions ORDER BY id");
  res.json(result.rows.map(r => ({ id: r.id, ...r.question_data })));
});

// Save exam config (subject, duration, questionsToShow, randomise)
router.post("/config", verifyToken, async (req, res) => {
  const { config } = req.body;
  await pool.query(
    "INSERT INTO exam_config(config_json, is_active) VALUES($1, false)",
    [JSON.stringify(config)]
  );
  res.json({ message: "Config saved" });
});

// Get all configs
router.get("/configs", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT id, is_active, config_json FROM exam_config");
  res.json(result.rows);
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
  const result = await pool.query("SELECT * FROM student_attempts ORDER BY submitted_at DESC");
  res.json(result.rows);
});

// Clear all questions
router.delete("/clear-questions", verifyToken, async (req, res) => {
  await pool.query("DELETE FROM questions");
  res.json({ message: "All questions cleared" });
});

// Clear all results
router.delete("/clear-results", verifyToken, async (req, res) => {
  await pool.query("DELETE FROM student_attempts");
  res.json({ message: "All results cleared" });
});

// Deactivate exam
router.post("/deactivate", verifyToken, async (req, res) => {
  await pool.query("UPDATE exam_config SET is_active = false");
  res.json({ message: "Exam deactivated" });
});

// Export CSV
router.get("/export", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT * FROM student_attempts ORDER BY submitted_at DESC");
  let csv = "roll_number,class,section,score,max_score,percentage,submitted_at\n";
  result.rows.forEach(r => {
    csv += `${r.roll_number},${r.class},${r.section},${r.score},${r.max_score},${r.percentage},${r.submitted_at}\n`;
  });
  res.setHeader("Content-Type", "text/csv");
  res.send(csv);
});

module.exports = router;