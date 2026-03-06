import React, { useState, useEffect } from "react";

export default function QuestionPanel({ question, selected, answerQuestion, lockQuestion, isLocked }) {
  const [singleSelected, setSingleSelected] = useState(selected || null);
  const [multiSelected, setMultiSelected] = useState(selected || []);

  useEffect(() => {
    if (question?.type === "single") setSingleSelected(selected || null);
    if (question?.type === "multiple") setMultiSelected(selected || []);
  }, [question?.id]);

  if (!question) return null;

  const handleSingle = (opt) => {
    if (isLocked) return;
    setSingleSelected(opt);
    answerQuestion(question.id, opt);
  };

  const confirmSingle = () => {
    if (!singleSelected) return alert("Please select an option.");
    lockQuestion(question.id);
  };

  const handleMulti = (opt) => {
    if (isLocked) return;
    setMultiSelected(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  const confirmMulti = () => {
    if (multiSelected.length === 0) return alert("Select at least one option.");
    answerQuestion(question.id, multiSelected);
    lockQuestion(question.id);
  };

  return (
    <div className="card flex-grow-1">
      <div className="card-body">
        <div className="text-muted small mb-1">
          Question {question.id}
          <span className={`badge ms-2 ${question.type === "multiple" ? "bg-warning text-dark" : "bg-info text-dark"}`}>
            {question.type === "multiple" ? "Multiple choice" : "Single choice"}
          </span>
          {isLocked && <span className="badge bg-success ms-2">✔ Answered</span>}
        </div>
        <h5 className="card-title mb-4">{question.question}</h5>

        {/* Single choice */}
        {question.type === "single" && question.options.map(opt => (
          <div
            key={opt}
            onClick={() => handleSingle(opt)}
            className={`d-flex align-items-center gap-2 p-3 mb-2 rounded border
              ${isLocked ? "" : "cursor-pointer"}
              ${(isLocked ? selected : singleSelected) === opt ? "border-primary bg-primary bg-opacity-10 fw-semibold" : "border-light-subtle"}
            `}
            style={{ cursor: isLocked ? "default" : "pointer" }}
          >
            <input
              type="radio"
              checked={(isLocked ? selected : singleSelected) === opt}
              disabled={isLocked}
              onChange={() => handleSingle(opt)}
              className="form-check-input mt-0"
            />
            {opt}
          </div>
        ))}

        {/* Confirm button for single */}
        {question.type === "single" && !isLocked && (
          <button
            className="btn btn-primary mt-2"
            onClick={confirmSingle}
            disabled={!singleSelected}
          >
            Confirm Answer
          </button>
        )}

        {/* Multiple choice */}
        {question.type === "multiple" && question.options.map(opt => {
          const isChecked = (isLocked ? selected : multiSelected)?.includes(opt);
          return (
            <label
              key={opt}
              className={`d-flex align-items-center gap-2 p-3 mb-2 rounded border
                ${isLocked ? "" : "cursor-pointer"}
                ${isChecked ? "border-primary bg-primary bg-opacity-10 fw-semibold" : "border-light-subtle"}
              `}
              style={{ cursor: isLocked ? "default" : "pointer" }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                disabled={isLocked}
                onChange={() => handleMulti(opt)}
                className="form-check-input mt-0"
              />
              {opt}
            </label>
          );
        })}

        {/* Confirm button for multiple */}
        {question.type === "multiple" && !isLocked && (
          <button
            className="btn btn-primary mt-2"
            onClick={confirmMulti}
            disabled={multiSelected.length === 0}
          >
            Confirm Answer
          </button>
        )}

        {isLocked && <p className="text-muted small mt-3 fst-italic">This answer is locked and cannot be changed.</p>}
      </div>
    </div>
  );
}