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

// Check if exam is active — returns questions randomised/sliced per config
router.get("/status", async (req, res) => {
  const configResult = await pool.query(
    "SELECT * FROM exam_config WHERE is_active=true ORDER BY id DESC LIMIT 1"
  );
  if (!configResult.rows.length) return res.json({ active: false });

  const config = configResult.rows[0].config_json;

  // Load all questions from DB
  const qResult = await pool.query("SELECT question_data FROM questions ORDER BY id");
  let questions = qResult.rows.map(r => r.question_data);

  if (questions.length === 0) return res.json({ active: false, error: "No questions uploaded" });

  // Randomise if enabled
  if (config.randomise) questions = shuffle(questions);

  // Slice to questionsToShow if set and valid
  const limit = config.questionsToShow;
  if (limit && limit > 0 && limit < questions.length) {
    questions = questions.slice(0, limit);
  }

  // Re-index question ids so frontend navigation works correctly
  questions = questions.map((q, idx) => ({ ...q, id: idx + 1 }));

  res.json({ active: true, config: { ...config, questions } });
});

// Submit answers
router.post("/submit", async (req, res) => {
  const { roll_number, class: cls, section, answers } = req.body;

  const check = await pool.query(
    "SELECT * FROM student_attempts WHERE roll_number=$1", [roll_number]
  );
  if (check.rows.length) return res.status(400).json({ message: "Already submitted" });

  const graderResp = await axios.post("http://python-service:8000/grade", { answers });
  const { score, max_score, percentage } = graderResp.data;

  const insert = await pool.query(
    "INSERT INTO student_attempts(roll_number,class,section,score,max_score,percentage,answers_json) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
    [roll_number, cls, section, score, max_score, percentage, answers]
  );

  // Broadcast new result to all connected WebSocket clients (admin dashboard)
  const broadcast = req.app.get("broadcast");
  if (broadcast) broadcast({ type: "NEW_RESULT", result: insert.rows[0] });

  res.json({ score, max_score, percentage });
});

module.exports = router;