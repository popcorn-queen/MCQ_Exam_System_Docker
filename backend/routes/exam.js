const express = require("express");
const pool = require("../db/db");
const axios = require("axios");

const router = express.Router();

// Fisher-Yates shuffle
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Check if a student has already submitted — roll + class + section
router.get("/check", async (req, res) => {
  const { roll, cls, section } = req.query;
  if (!roll || !cls || !section) return res.status(400).json({ error: "Missing parameters." });
  if (!/^\d{3}$/.test(roll)) return res.status(400).json({ error: "Roll number must be exactly 3 digits." });
  const clsNum = Number(cls);
  if (clsNum < 5 || clsNum > 10) return res.status(400).json({ error: "Class must be between 5 and 10." });
  if (!/^[A-C]$/.test(section.toUpperCase())) return res.status(400).json({ error: "Section must be A, B or C." });

  const result = await pool.query(
    "SELECT id FROM student_attempts WHERE roll_number=$1 AND class=$2 AND section=$3",
    [roll, cls, section.toUpperCase()]
  );
  res.json({ submitted: result.rows.length > 0 });
});

// Check if exam is active — returns questions randomised/sliced per config
router.get("/status", async (req, res) => {
  const configResult = await pool.query(
    "SELECT * FROM exam_config WHERE is_active=true ORDER BY id DESC LIMIT 1"
  );
  if (!configResult.rows.length) return res.json({ active: false });

  const config = configResult.rows[0].config_json;

  const qResult = await pool.query("SELECT question_data FROM questions ORDER BY id");
  let questions = qResult.rows.map(r => r.question_data);

  if (questions.length === 0) return res.json({ active: false, error: "No questions uploaded" });

  if (config.randomise) questions = shuffle(questions);

  const limit = config.questionsToShow;
  if (limit && limit > 0 && limit < questions.length) {
    questions = questions.slice(0, limit);
  }

  questions = questions.map((q, idx) => ({ ...q, id: idx + 1 }));

  res.json({ active: true, config: { ...config, questions } });
});

// Submit answers
router.post("/submit", async (req, res) => {
  const { roll_number, class: cls, section, answers, questions, tabSwitches } = req.body;

  // Server-side validation
  if (!/^\d{3}$/.test(roll_number)) return res.status(400).json({ message: "Invalid roll number." });
  const clsNum = Number(cls);
  if (clsNum < 5 || clsNum > 10) return res.status(400).json({ message: "Invalid class." });
  if (!/^[A-C]$/.test((section || "").toUpperCase())) return res.status(400).json({ message: "Invalid section." });

  const check = await pool.query(
    "SELECT id FROM student_attempts WHERE roll_number=$1 AND class=$2 AND section=$3",
    [roll_number, cls, section]
  );
  if (check.rows.length) return res.status(400).json({ message: "Already submitted" });

  const graderResp = await axios.post("http://python-service:8000/grade", { answers, questions });
  const { score, max_score, percentage } = graderResp.data;

  const insert = await pool.query(
    `INSERT INTO student_attempts
      (roll_number, class, section, score, max_score, percentage, answers_json, tab_switches)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [roll_number, cls, section, score, max_score, percentage, answers, tabSwitches || 0]
  );

  const broadcast = req.app.get("broadcast");
  if (broadcast) broadcast({ type: "NEW_RESULT", result: insert.rows[0] });

  res.json({ score, max_score, percentage });
});

module.exports = router;