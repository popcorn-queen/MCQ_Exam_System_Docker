import React, { useState, useEffect } from "react";
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
  const [timeLeft, setTimeLeft] = useState(examConfig?.durationMinutes * 60);

  // Load questions
  useEffect(() => {
    fetch("/questions.json")
      .then(res => res.json())
      .then(data => setQuestions(data.questions));
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!examStarted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
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

    // Lock immediately for single choice
    const q = questions.find(q => q.id === qId);
    if (q.type === "single") setLocked(prev => [...prev, qId]);
  };

  const lockMultiple = (qId) => {
    if (!locked.includes(qId)) setLocked(prev => [...prev, qId]);
  };

  const finishExam = async () => {
    // send to backend
    const payload = {
      roll_number: student.roll,
      class: student.cls,
      section: student.section,
      answers
    };
    const resp = await fetch("/api/exam/submit", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    sessionStorage.setItem("result", JSON.stringify(data));
    navigate("/result");
  };

  if (!questions.length) return <div>Loading...</div>;
return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex justify-between items-center mb-4">
        <h2>{examConfig?.examTitle}</h2>
        {examStarted && <Timer timeLeft={timeLeft} />}
      </div>
      <div className="flex flex-1">
        <NavigationGrid
          questions={questions}
          locked={locked}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
        />
        <QuestionPanel
          question={questions[currentIndex]}
          selected={answers[questions[currentIndex].id]}
          answerQuestion={answerQuestion}
          lockMultiple={lockMultiple}
        />
      </div>
      <div className="mt-4 flex justify-center">
        <button className="bg-red-600 text-white px-4 py-2" onClick={finishExam}>
          Finish Exam
        </button>
      </div>
      {!examStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90">
          <button className="bg-green-600 text-white px-6 py-3 text-xl" onClick={startExam}>
            START EXAM
          </button>
        </div>
      )}
    </div>
  );
}

export default Exam;