const express = require("express");
const pool = require("../db/db");
const ExcelJS = require("exceljs");
const { generateToken, verifyToken } = require("../utils/auth");

const router = express.Router();

// Middleware that accepts token from Authorization header OR ?token= query param
// Used for export routes opened in a new browser tab
const verifyTokenFlex = (req, res, next) => {
  const queryToken = req.query.token;
  if (queryToken) {
    req.headers["authorization"] = `Bearer ${queryToken}`;
  }
  return verifyToken(req, res, next);
};

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = generateToken(username);
    res.json({ token });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// ── Questions ─────────────────────────────────────────────────────────────────
router.post("/upload-questions", verifyToken, async (req, res) => {
  const { questions } = req.body;
  if (!Array.isArray(questions) || questions.length === 0)
    return res.status(400).json({ message: "Invalid questions format" });

  for (const q of questions) {
    if (!q.question || !q.type || !q.options || !q.correctAnswer)
      return res.status(400).json({ message: `Invalid question: ${JSON.stringify(q)}` });
  }

  await pool.query("DELETE FROM questions");
  for (const q of questions) {
    await pool.query("INSERT INTO questions(question_data) VALUES($1)", [JSON.stringify(q)]);
  }
  res.json({ message: `${questions.length} questions uploaded successfully` });
});

router.get("/questions", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT id, question_data FROM questions ORDER BY id");
  res.json(result.rows.map(r => ({ id: r.id, ...r.question_data })));
});

router.delete("/clear-questions", verifyToken, async (req, res) => {
  await pool.query("DELETE FROM questions");
  res.json({ message: "All questions cleared" });
});

// ── Exam config ───────────────────────────────────────────────────────────────
router.post("/config", verifyToken, async (req, res) => {
  const { config } = req.body;
  await pool.query(
    "INSERT INTO exam_config(config_json, is_active) VALUES($1, false)",
    [JSON.stringify(config)]
  );
  res.json({ message: "Config saved" });
});

router.get("/configs", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT id, is_active, config_json FROM exam_config");
  res.json(result.rows);
});

router.post("/activate", verifyToken, async (req, res) => {
  const { examId } = req.body;
  await pool.query("UPDATE exam_config SET is_active = false");
  await pool.query("UPDATE exam_config SET is_active = true WHERE id=$1", [examId]);
  res.json({ message: "Exam activated" });
});

router.post("/deactivate", verifyToken, async (req, res) => {
  await pool.query("UPDATE exam_config SET is_active = false");
  res.json({ message: "Exam deactivated" });
});

// ── Results ───────────────────────────────────────────────────────────────────
router.get("/results", verifyToken, async (req, res) => {
  const result = await pool.query("SELECT * FROM student_attempts ORDER BY submitted_at DESC");
  res.json(result.rows);
});

router.delete("/clear-results", verifyToken, async (req, res) => {
  await pool.query("DELETE FROM student_attempts");
  res.json({ message: "All results cleared" });
});

// ── Export helpers ────────────────────────────────────────────────────────────
const getExportFilename = async (ext) => {
  const cfg = await pool.query(
    "SELECT config_json FROM exam_config WHERE is_active=true ORDER BY id DESC LIMIT 1"
  );
  const subject = cfg.rows[0]?.config_json?.subject?.replace(/\s+/g, "_") || "results";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${subject}_${date}.${ext}`;
};

// ── Export CSV ────────────────────────────────────────────────────────────────
router.get("/export/csv", verifyTokenFlex, async (req, res) => {
  const result = await pool.query("SELECT * FROM student_attempts ORDER BY submitted_at DESC");
  const filename = await getExportFilename("csv");
  let csv = "Roll Number,Class,Section,Score,Max Score,Percentage,Tab Switches,Submitted At\n";
  result.rows.forEach(r => {
    csv += `${r.roll_number},${r.class},${r.section},${r.score},${r.max_score},${r.percentage?.toFixed(2)},${r.tab_switches ?? 0},${new Date(r.submitted_at).toLocaleString()}\n`;
  });
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  res.send(csv);
});

// ── Export Excel ──────────────────────────────────────────────────────────────
router.get("/export/excel", verifyTokenFlex, async (req, res) => {
  const { ids } = req.query;
  let result;
  if (ids) {
    const idList = ids.split(",").map(Number).filter(Boolean);
    result = await pool.query(
      "SELECT * FROM student_attempts WHERE id = ANY($1) ORDER BY submitted_at DESC",
      [idList]
    );
  } else {
    result = await pool.query("SELECT * FROM student_attempts ORDER BY submitted_at DESC");
  }
  const filename = await getExportFilename("xlsx");

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MCQ Exam Platform";
  const sheet = workbook.addWorksheet("Results");

  sheet.columns = [
    { header: "Roll Number",  key: "roll_number",  width: 15 },
    { header: "Class",        key: "class",        width: 10 },
    { header: "Section",      key: "section",      width: 10 },
    { header: "Score",        key: "score",        width: 10 },
    { header: "Max Score",    key: "max_score",    width: 12 },
    { header: "Percentage",   key: "percentage",   width: 14 },
    { header: "Tab Switches", key: "tab_switches", width: 15 },
    { header: "Submitted At", key: "submitted_at", width: 22 },
  ];

  // Bold header row
  sheet.getRow(1).font = { bold: true };

  result.rows.forEach(r => {
    sheet.addRow({
      roll_number:  r.roll_number,
      class:        r.class,
      section:      r.section,
      score:        r.score,
      max_score:    r.max_score,
      percentage:   parseFloat(r.percentage?.toFixed(2)),
      tab_switches: r.tab_switches ?? 0,
      submitted_at: new Date(r.submitted_at).toLocaleString(),
    });
  });

  // Highlight rows with tab switches in light red
  sheet.eachRow((row, rowNum) => {
    if (rowNum === 1) return;
    const tabCell = row.getCell("tab_switches");
    if (tabCell.value > 0) {
      row.eachCell(cell => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD0D0" } };
      });
    }
  });

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = router;