import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import NavigationGrid from "../components/NavigationGrid";
import QuestionPanel from "../components/QuestionPanel";
import Timer from "../components/Timer";

function Exam() {
  const navigate = useNavigate();
  const student = JSON.parse(sessionStorage.getItem("student"));
  const examConfig = JSON.parse(sessionStorage.getItem("examConfig"));
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [locked, setLocked] = useState([]);
  const [examStarted, setExamStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState((examConfig?.durationMinutes || 30) * 60);
  const finishCalled = useRef(false);

  // Load questions from config if available, fallback to questions.json
  useEffect(() => {
    if (examConfig?.questions?.length) {
      setQuestions(examConfig.questions);
    } else {
      fetch("/questions.json")
        .then(res => res.json())
        .then(data => setQuestions(data.questions));
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!examStarted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examStarted]);

  const startExam = () => setExamStarted(true);

  const answerQuestion = (qId, selected) => {
    if (locked.includes(qId)) return;
    setAnswers(prev => ({ ...prev, [qId]: selected }));
    const q = questions.find(q => q.id === qId);
    if (q.type === "single") setLocked(prev => [...prev, qId]);
  };

  const lockMultiple = (qId) => {
    if (!locked.includes(qId)) setLocked(prev => [...prev, qId]);
  };

  const finishExam = async () => {
    if (finishCalled.current) return;
    finishCalled.current = true;
    const payload = {
      roll_number: student.roll,
      class: student.cls,
      section: student.section,
      answers
    };
    try {
      const resp = await fetch("/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      sessionStorage.setItem("result", JSON.stringify(data));
      navigate("/result");
    } catch (e) {
      alert("Failed to submit exam. Please try again.");
      finishCalled.current = false;
    }
  };

  if (!questions.length) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="flex flex-col h-screen">

      {/* Title Panel */}
      <div className="flex items-center justify-between bg-blue-700 text-white px-6 py-3">
        <div>
          <div className="text-lg font-bold">{examConfig?.schoolName || "School Name"}</div>
          <div className="text-sm">{examConfig?.subject || "Subject"} — {examConfig?.examTitle || "Exam"}</div>
        </div>
        <div className="text-right">
          {examStarted
            ? <Timer timeLeft={timeLeft} />
            : <div className="text-sm opacity-75">Timer starts on exam start</div>
          }
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">

        {/* Left Panel — Navigation Grid */}
        <div className="w-48 flex-shrink-0">
          <div className="text-sm font-semibold mb-2 text-gray-600">Questions</div>
          <NavigationGrid
            questions={questions}
            locked={locked}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />
        </div>

        {/* Right Panel — Question */}
        <div className="flex-1 flex flex-col">
          <QuestionPanel
            question={questions[currentIndex]}
            selected={answers[questions[currentIndex]?.id]}
            answerQuestion={answerQuestion}
            lockMultiple={lockMultiple}
            isLocked={locked.includes(questions[currentIndex]?.id)}
          />

          {/* Navigation buttons + Submit on last */}
          <div className="flex justify-between mt-4">
            <button
              className="bg-gray-300 px-4 py-2 rounded disabled:opacity-40"
              onClick={() => setCurrentIndex(i => i - 1)}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>
            {isLastQuestion ? (
              <button
                className="bg-red-600 text-white px-6 py-2 rounded"
                onClick={finishExam}
              >
                Submit Exam
              </button>
            ) : (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => setCurrentIndex(i => i + 1)}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Start Exam Overlay */}
      {!examStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 z-10">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{examConfig?.examTitle || "Exam"}</div>
            <div className="text-gray-600 mb-1">{examConfig?.schoolName}</div>
            <div className="text-gray-600 mb-6">{examConfig?.subject} | {examConfig?.durationMinutes || 30} minutes | {questions.length} questions</div>
            <button className="bg-green-600 text-white px-8 py-3 text-xl rounded shadow" onClick={startExam}>
              START EXAM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Exam;