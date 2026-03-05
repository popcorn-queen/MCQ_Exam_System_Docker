import React, { useState, useEffect } from "react";

export default function QuestionPanel({ question, selected, answerQuestion, lockMultiple, isLocked }) {
  const [multiSelected, setMultiSelected] = useState(selected || []);

  useEffect(() => {
    if (question?.type === "multiple") setMultiSelected(selected || []);
  }, [question?.id]);

  if (!question) return null;

  const handleSingle = (opt) => { if (!isLocked) answerQuestion(question.id, opt); };
  const handleMulti = (opt) => {
    if (isLocked) return;
    setMultiSelected(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);
  };
  const confirmMulti = () => {
    if (multiSelected.length === 0) return alert("Select at least one option.");
    answerQuestion(question.id, multiSelected);
    lockMultiple(question.id);
  };

  return (
    <div className="card flex-grow-1">
      <div className="card-body">
        <div className="text-muted small mb-1">
          Question {question.id} {isLocked && <span className="text-primary ms-2">✔ Answered</span>}
        </div>
        <h5 className="card-title mb-4">{question.question}</h5>

        {question.type === "single" && question.options.map(opt => (
          <div
            key={opt}
            onClick={() => handleSingle(opt)}
            className={`d-flex align-items-center gap-2 p-3 mb-2 rounded border ${isLocked ? "" : "cursor-pointer"} ${selected === opt ? "border-primary bg-primary bg-opacity-10 fw-semibold" : "border-light-subtle"}`}
            style={{ cursor: isLocked ? "default" : "pointer" }}
          >
            <input type="radio" checked={selected === opt} disabled={isLocked} onChange={() => handleSingle(opt)} className="form-check-input mt-0" />
            {opt}
          </div>
        ))}

        {question.type === "multiple" && question.options.map(opt => {
          const isChecked = (isLocked ? selected : multiSelected)?.includes(opt);
          return (
            <label
              key={opt}
              className={`d-flex align-items-center gap-2 p-3 mb-2 rounded border ${isLocked ? "" : "cursor-pointer"} ${isChecked ? "border-primary bg-primary bg-opacity-10 fw-semibold" : "border-light-subtle"}`}
              style={{ cursor: isLocked ? "default" : "pointer" }}
            >
              <input type="checkbox" checked={isChecked} disabled={isLocked} onChange={() => handleMulti(opt)} className="form-check-input mt-0" />
              {opt}
            </label>
          );
        })}

        {question.type === "multiple" && !isLocked && (
          <button className="btn btn-primary mt-2" onClick={confirmMulti} disabled={multiSelected.length === 0}>
            Confirm Answer
          </button>
        )}

        {isLocked && <p className="text-muted small mt-3 fst-italic">This answer is locked and cannot be changed.</p>}
      </div>
    </div>
  );
}