import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavigationGrid from "../components/NavigationGrid";
import QuestionPanel from "../components/QuestionPanel";
import Timer from "../components/Timer";
import useBranding from "../hooks/useBranding";

function Exam() {
  const navigate = useNavigate();
  const student = JSON.parse(sessionStorage.getItem("student"));
  const examConfig = JSON.parse(sessionStorage.getItem("examConfig"));
  const { schoolName, logoFile } = useBranding();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [locked, setLocked] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState((examConfig?.durationMinutes || 30) * 60);
  const finishCalled = useRef(false);

  useEffect(() => {
    if (examConfig?.questions?.length) setQuestions(examConfig.questions);
    else fetch("/questions.json").then(r => r.json()).then(d => setQuestions(d.questions));
  }, []);

  useEffect(() => {
    if (!examStarted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); finishExam(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted]);

  const answerQuestion = (qId, selected) => {
    if (locked.includes(qId)) return;
    setAnswers(prev => ({ ...prev, [qId]: selected }));
  };

  const lockQuestion = (qId) => {
    if (!locked.includes(qId)) setLocked(prev => [...prev, qId]);
  };

  const finishExam = async () => {
    if (finishCalled.current) return;
    finishCalled.current = true;
    try {
      const resp = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll_number: student.roll,
          class: student.cls,
          section: student.section,
          answers,
          questions
        })
      });
      const data = await resp.json();
      sessionStorage.removeItem("student");
      sessionStorage.removeItem("examConfig");
      sessionStorage.setItem("result", JSON.stringify(data));
      navigate("/result");
    } catch {
      alert("Failed to submit. Please try again.");
      finishCalled.current = false;
    }
  };

  const handleFinish = () => {
    if (window.confirm("Are you sure you want to finish? You cannot change answers after submission.")) {
      finishExam();
    }
  };

  if (!questions.length) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border text-primary" />
    </div>
  );

  // ── PRE-EXAM SCREEN ──────────────────────────────────────────────
  if (!examStarted) {
    const totalWeight = questions.reduce((sum, q) => sum + (q.weight || 1), 0);
    return (
      <div className="min-vh-100 d-flex flex-column">
        <div className="bg-primary text-white px-4 py-2 d-flex justify-content-between align-items-center" style={{ minHeight: 70 }}>
          <div className="d-flex align-items-center gap-3">
            {logoFile && (
              <img src={`/${logoFile}`} alt="School Logo" style={{ height: 50, width: 50, objectFit: "contain", borderRadius: 6, background: "white", padding: 3 }} />
            )}
            <div>
              <div className="fw-bold fs-5">{schoolName}</div>
              <div className="small opacity-75">{examConfig?.subject}</div>
            </div>
          </div>
        </div>
        <div className="flex-grow-1 d-flex align-items-center justify-content-center bg-light">
          <div className="card shadow-sm p-5 text-center" style={{ maxWidth: 500, width: "100%" }}>
            <h3 className="fw-bold mb-1">{examConfig?.subject || "Exam"}</h3>
            <p className="text-muted mb-4">{schoolName}</p>
            <div className="row g-3 mb-4">
              <div className="col-4">
                <div className="border rounded py-3">
                  <div className="fs-4 fw-bold text-primary">{examConfig?.durationMinutes || 30}</div>
                  <div className="text-muted small">Minutes</div>
                </div>
              </div>
              <div className="col-4">
                <div className="border rounded py-3">
                  <div className="fs-4 fw-bold text-primary">{questions.length}</div>
                  <div className="text-muted small">Questions</div>
                </div>
              </div>
              <div className="col-4">
                <div className="border rounded py-3">
                  <div className="fs-4 fw-bold text-primary">{totalWeight}</div>
                  <div className="text-muted small">Total Marks</div>
                </div>
              </div>
            </div>
            <p className="text-muted small mb-4">Once started, the timer cannot be paused.</p>
            <button className="btn btn-success btn-lg" onClick={() => setExamStarted(true)}>
              Start Exam
            </button>
          </div>
        </div>
        <div className="border-top py-2 text-center text-muted small bg-light">
          MCQ Exam Platform
        </div>
      </div>
    );
  }

  // ── EXAM SCREEN ──────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* Top bar */}
      <div className="theme-header px-4 py-2 d-flex justify-content-between align-items-center" style={{ flexShrink: 0, minHeight: 70 }}>
        <div className="d-flex align-items-center gap-3">
          {logoFile && (
            <img src={`/${logoFile}`} alt="School Logo" style={{ height: 50, width: 50, objectFit: "contain", borderRadius: 6, background: "white", padding: 3 }} />
          )}
          <div>
            <div className="fw-bold fs-5">{schoolName}</div>
            <div className="small opacity-75">{examConfig?.subject}</div>
          </div>
        </div>
        <Timer timeLeft={timeLeft} />
      </div>

      {/* Middle */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left panel */}
        <div className="border-end bg-light p-3" style={{ width: 200, flexShrink: 0, overflowY: "auto" }}>
          <div className="text-muted small fw-semibold mb-2">Questions</div>
          <NavigationGrid
            questions={questions}
            locked={locked}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Question area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            <QuestionPanel
              question={questions[currentIndex]}
              selected={answers[questions[currentIndex]?.id]}
              answerQuestion={answerQuestion}
              lockQuestion={lockQuestion}
              isLocked={locked.includes(questions[currentIndex]?.id)}
            />
          </div>

          {/* Buttons */}
          <div className="border-top bg-white px-4 py-3 d-flex justify-content-between align-items-center" style={{ flexShrink: 0 }}>
            <button
              className="btn btn-outline-secondary"
              onClick={() => setCurrentIndex(i => i - 1)}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>
            <button className="btn btn-danger px-4" onClick={handleFinish}>
              Finish Exam
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setCurrentIndex(i => i + 1)}
              disabled={currentIndex === questions.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-top bg-light py-1 text-center text-muted small" style={{ flexShrink: 0 }}>
        MCQ Exam Platform
      </div>

    </div>
  );
}

export default Exam;