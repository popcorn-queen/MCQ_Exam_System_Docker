import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavigationGrid from "../components/NavigationGrid";
import QuestionPanel from "../components/QuestionPanel";
import Timer from "../components/Timer";
import useBranding from "../hooks/useBranding";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";

function Exam() {
  const navigate = useNavigate();
  const student = JSON.parse(sessionStorage.getItem("student"));
  const examConfig = JSON.parse(sessionStorage.getItem("examConfig"));
  const { schoolName, logoFile, theme } = useBranding();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => {
    const saved = sessionStorage.getItem("examAnswers");
    return saved ? JSON.parse(saved) : {};
  });
  const [locked, setLocked] = useState(() => {
    const saved = sessionStorage.getItem("examLocked");
    return saved ? JSON.parse(saved) : [];
  });
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState((examConfig?.durationMinutes || 30) * 60);
  const [tabSwitches, setTabSwitches] = useState(() => {
    return Number(sessionStorage.getItem("examTabSwitches") || 0);
  });
  const [submitError, setSubmitError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const finishCalled = useRef(false);
  const tabSwitchRef = useRef(tabSwitches);

  // ── Load questions ───────────────────────────────────────────────
  useEffect(() => {
    if (examConfig?.questions?.length) setQuestions(examConfig.questions);
    else fetch("/questions.json").then(r => r.json()).then(d => setQuestions(d.questions));
  }, []);

  // ── Restore timer if exam was already started before refresh ────
  useEffect(() => {
    const savedStartTime = sessionStorage.getItem("examStartTime");
    if (savedStartTime) {
      const elapsed = Math.floor((Date.now() - Number(savedStartTime)) / 1000);
      const duration = (examConfig?.durationMinutes || 30) * 60;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
      setExamStarted(true);
    }
  }, []);

  // ── Auto-finish if time already expired on restore ───────────────
  useEffect(() => {
    if (examStarted && timeLeft <= 0 && questions.length) finishExam();
  }, [examStarted, questions]);

  // ── Countdown timer ──────────────────────────────────────────────
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

  // ── Tab switch detection ─────────────────────────────────────────
  useEffect(() => {
    if (!examStarted) return;
    const handleVisibility = () => {
      if (document.hidden) {
        const next = tabSwitchRef.current + 1;
        tabSwitchRef.current = next;
        setTabSwitches(next);
        sessionStorage.setItem("examTabSwitches", next);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [examStarted]);

  // ── Persist answers + locked on every change ─────────────────────
  useEffect(() => { sessionStorage.setItem("examAnswers", JSON.stringify(answers)); }, [answers]);
  useEffect(() => { sessionStorage.setItem("examLocked", JSON.stringify(locked)); }, [locked]);

  // ── Fullscreen helpers ───────────────────────────────────────────
  const enterFullscreen = async () => {
    try { await document.documentElement.requestFullscreen(); } catch {}
  };
  const exitFullscreen = () => {
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch {}
  };

  // ── Exam actions ─────────────────────────────────────────────────
  const handleStart = () => {
    sessionStorage.setItem("examStartTime", Date.now());
    setExamStarted(true);
    enterFullscreen();
  };

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
    exitFullscreen();
    setSubmitError("");

    // Clear persistence
    sessionStorage.removeItem("examAnswers");
    sessionStorage.removeItem("examLocked");
    sessionStorage.removeItem("examStartTime");
    sessionStorage.removeItem("examTabSwitches");

    try {
      const resp = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roll_number: student.roll,
          class: student.cls,
          section: student.section,
          answers,
          questions,
          tabSwitches: tabSwitchRef.current,
        })
      });
      const data = await resp.json();
      sessionStorage.removeItem("student");
      sessionStorage.removeItem("examConfig");
      sessionStorage.setItem("result", JSON.stringify(data));
      navigate("/result");
    } catch {
      setSubmitError("Submission failed. Please try again.");
      finishCalled.current = false;
    }
  };

  // ── Loading state ─────────────────────────────────────────────────
  if (!questions.length) return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="spinner-border" style={{ color: "var(--theme-btn-primary)" }} />
    </div>
  );

  // ── PRE-EXAM SCREEN ───────────────────────────────────────────────
  if (!examStarted) {
    const totalWeight = questions.reduce((sum, q) => sum + (q.weight || 1), 0);
    return (
      <div className="min-vh-100 d-flex flex-column">
        <div className="px-4 py-2 d-flex align-items-center"
          style={{ minHeight: 60, backgroundColor: theme?.background || "#fefee3", borderBottom: `2px solid ${theme?.border || "#353535"}` }}>
          <div className="d-flex align-items-center gap-3">
            {logoFile && <img src={`/${logoFile}`} alt="School Logo" style={{ height: 40, maxWidth: 80, objectFit: "contain" }} />}
            <div>
              <div className="fw-bold fs-5" style={{ color: "var(--theme-text-dark)" }}>{schoolName}</div>
              <div className="theme-header-subtitle">{examConfig?.subject}</div>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 d-flex align-items-center justify-content-center" style={{ backgroundColor: "var(--theme-bg)" }}>
          <div className="card shadow-sm p-5 text-center" style={{ maxWidth: 500, width: "100%" }}>
            <h3 className="fw-bold mb-1" style={{ color: "var(--theme-text-dark)" }}>{examConfig?.subject || "Exam"}</h3>
            <p className="mb-4" style={{ color: "var(--theme-text-muted)" }}>{schoolName}</p>
            <div className="row g-3 mb-4">
              {[[examConfig?.durationMinutes || 30, "Minutes"], [questions.length, "Questions"], [totalWeight, "Total Marks"]].map(([val, label]) => (
                <div className="col-4" key={label}>
                  <div className="border rounded py-3" style={{ borderColor: "var(--theme-border)" }}>
                    <div className="fs-4 fw-bold" style={{ color: "var(--theme-btn-primary)" }}>{val}</div>
                    <div className="small" style={{ color: "var(--theme-text-muted)" }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="small mb-1" style={{ color: "var(--theme-text-muted)" }}>Once started, the timer cannot be paused.</p>
            <p className="small mb-4" style={{ color: "var(--theme-text-muted)" }}>The exam will open in fullscreen. Tab switches are recorded.</p>
            <button className="btn btn-lg theme-btn-primary" onClick={handleStart}>
              Start Exam
            </button>
          </div>
        </div>

        <div className="theme-footer py-2 text-center small">MCQ Exam Platform</div>
      </div>
    );
  }

  // ── EXAM SCREEN ───────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* Header */}
      <div className="px-4 py-2 d-flex justify-content-between align-items-center"
        style={{ flexShrink: 0, minHeight: 60, backgroundColor: theme?.background || "#fefee3", borderBottom: `2px solid ${theme?.border || "#353535"}` }}>
        <div className="d-flex align-items-center gap-3">
          {logoFile && <img src={`/${logoFile}`} alt="School Logo" style={{ height: 40, maxWidth: 80, objectFit: "contain" }} />}
          <div>
            <div className="fw-bold fs-5" style={{ color: "var(--theme-text-dark)" }}>{schoolName}</div>
            <div className="theme-header-subtitle">{examConfig?.subject}</div>
          </div>
        </div>
        <Timer timeLeft={timeLeft} />
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* Left nav */}
        <div className="border-end p-3" style={{ width: 200, flexShrink: 0, overflowY: "auto", backgroundColor: "var(--theme-card-bg)" }}>
          <div className="fw-semibold small mb-2" style={{ color: "var(--theme-text-muted)" }}>Questions</div>
          <NavigationGrid
            questions={questions}
            locked={locked}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />
        </div>

        {/* Right panel */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", backgroundColor: "var(--theme-bg)" }}>
          {submitError && (
            <div className="alert alert-danger py-2 small mx-3 mt-3 mb-0" role="alert">{submitError}</div>
          )}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
            <QuestionPanel
              question={questions[currentIndex]}
              selected={answers[questions[currentIndex]?.id]}
              answerQuestion={answerQuestion}
              lockQuestion={lockQuestion}
              isLocked={locked.includes(questions[currentIndex]?.id)}
            />
          </div>

          {/* Nav buttons */}
          <div className="border-top px-4 py-3 d-flex justify-content-between align-items-center"
            style={{ flexShrink: 0, backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-border)" }}>
            <button className="btn theme-btn-ghost d-flex align-items-center gap-2"
              onClick={() => setCurrentIndex(i => i - 1)} disabled={currentIndex === 0}>
              <ArrowLeft size={16} /> Previous
            </button>
            <button className="btn theme-btn-destructive px-4" onClick={() => setShowConfirm(true)}>
              Finish Exam
            </button>
            <button className="btn theme-btn-navigate d-flex align-items-center gap-2"
              onClick={() => setCurrentIndex(i => i + 1)} disabled={currentIndex === questions.length - 1}>
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="theme-footer py-1 text-center small" style={{ flexShrink: 0 }}>MCQ Exam Platform</div>

      {/* Finish confirmation modal */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div className="card p-4 shadow-lg text-center" style={{ maxWidth: 400, width: "90%" }}>
            <h5 className="fw-bold mb-2" style={{ color: "var(--theme-text-dark)" }}>Finish Exam?</h5>
            <p className="small mb-4" style={{ color: "var(--theme-text-muted)" }}>
              You cannot change your answers after submission. Are you sure?
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button className="btn theme-btn-cancel px-4" onClick={() => setShowConfirm(false)}>Go Back</button>
              <button className="btn theme-btn-destructive px-4" onClick={() => { setShowConfirm(false); finishExam(); }}>Yes, Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exam;