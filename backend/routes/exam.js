const express = require("express");
const pool = require("../db/db");
const axios = require("axios");

const router = express.Router();

// Check if exam is active
router.get("/status", async (req, res) => {
  const result = await pool.query("SELECT * FROM exam_config WHERE is_active=true ORDER BY id DESC LIMIT 1");
  if (result.rows.length) {
    res.json({ active: true, config: result.rows[0].config_json });
  } else {
    res.json({ active: false });
  }
});

// Submit answers
router.post("/submit", async (req, res) => {
  const { roll_number, class: cls, section, answers } = req.body;

  // Check if already submitted
  const check = await pool.query("SELECT * FROM student_attempts WHERE roll_number=$1", [roll_number]);
  if (check.rows.length) return res.status(400).json({ message: "Already submitted" });

  // Send answers to Python grader
  const graderResp = await axios.post("http://python-service:8000/grade", { answers });

  // Store in DB
  const { score, max_score, percentage } = graderResp.data;
  await pool.query(
    "INSERT INTO student_attempts(roll_number,class,section,score,max_score,percentage,answers_json) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [roll_number, cls, section, score, max_score, percentage, answers]
  );

  res.json({ score, max_score, percentage });
});

module.exports = router;