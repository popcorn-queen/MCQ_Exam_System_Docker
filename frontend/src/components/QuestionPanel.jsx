import React, { useState, useEffect } from "react";
import { CheckCircle } from "@phosphor-icons/react";

export default function QuestionPanel({ question, selected, answerQuestion, lockQuestion, isLocked }) {
  const [singleSelected, setSingleSelected] = useState(selected || null);
  const [multiSelected, setMultiSelected] = useState(selected || []);
  const [confirmError, setConfirmError] = useState("");

  useEffect(() => {
    setConfirmError("");
    if (question?.type === "single") setSingleSelected(selected || null);
    if (question?.type === "multiple") setMultiSelected(selected || []);
  }, [question?.id]);

  if (!question) return null;

  const handleSingle = (opt) => {
    if (isLocked) return;
    setConfirmError("");
    setSingleSelected(opt);
    answerQuestion(question.id, opt);
  };

  const confirmSingle = () => {
    if (!singleSelected) return setConfirmError("Please select an option before confirming.");
    lockQuestion(question.id);
  };

  const handleMulti = (opt) => {
    if (isLocked) return;
    setConfirmError("");
    setMultiSelected(prev =>
      prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
    );
  };

  const confirmMulti = () => {
    if (multiSelected.length === 0) return setConfirmError("Please select at least one option before confirming.");
    answerQuestion(question.id, multiSelected);
    lockQuestion(question.id);
  };

  const isMultiple = question.type === "multiple";

  return (
    <div className="card flex-grow-1" style={{ backgroundColor: "var(--theme-card-bg)", borderColor: "var(--theme-secondary)" }}>
      <div className="card-body">

        {/* Question meta */}
        <div className="small mb-1" style={{ color: "var(--theme-text-muted)" }}>
          Question {question.id}
          <span className="badge ms-2" style={{
            backgroundColor: isMultiple ? "#ffc107" : "var(--theme-secondary)",
            color: isMultiple ? "#000" : "var(--theme-primary-text)"
          }}>
            {isMultiple ? "Multiple choice" : "Single choice"}
          </span>
          {isLocked && (
            <span className="badge ms-2" style={{ backgroundColor: "#198754", color: "white" }}>
              <CheckCircle size={13} weight="fill" className="me-1" />Answered
            </span>
          )}
        </div>

        <h5 className="card-title mb-4" style={{ color: "var(--theme-text-dark)" }}>{question.question}</h5>

        {/* Single choice options */}
        {!isMultiple && question.options.map(opt => {
          const isSelected = (isLocked ? selected : singleSelected) === opt;
          return (
            <div
              key={opt}
              onClick={() => handleSingle(opt)}
              className="d-flex align-items-center gap-2 p-3 mb-2 rounded border"
              style={{
                cursor: isLocked ? "default" : "pointer",
                borderColor: isSelected ? "var(--theme-primary)" : "var(--theme-secondary)",
                backgroundColor: isSelected ? "var(--theme-primary)" : "transparent",
                color: isSelected ? "var(--theme-primary-text)" : "var(--theme-text-dark)",
                fontWeight: isSelected ? 600 : 400,
                transition: "all 0.15s ease",
              }}
            >
              <input
                type="radio"
                checked={isSelected}
                disabled={isLocked}
                onChange={() => handleSingle(opt)}
                className="form-check-input mt-0"
              />
              {opt}
            </div>
          );
        })}

        {/* Multiple choice options */}
        {isMultiple && question.options.map(opt => {
          const isChecked = (isLocked ? selected : multiSelected)?.includes(opt);
          return (
            <label
              key={opt}
              className="d-flex align-items-center gap-2 p-3 mb-2 rounded border"
              style={{
                cursor: isLocked ? "default" : "pointer",
                borderColor: isChecked ? "var(--theme-primary)" : "var(--theme-secondary)",
                backgroundColor: isChecked ? "var(--theme-primary)" : "transparent",
                color: isChecked ? "var(--theme-primary-text)" : "var(--theme-text-dark)",
                fontWeight: isChecked ? 600 : 400,
                transition: "all 0.15s ease",
              }}
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

        {/* Inline confirm error */}
        {confirmError && (
          <div className="alert alert-warning py-2 small mt-2 mb-0" role="alert">
            {confirmError}
          </div>
        )}

        {/* Confirm button */}
        {!isLocked && (
          <button
            className="btn theme-btn mt-3"
            onClick={isMultiple ? confirmMulti : confirmSingle}
            disabled={isMultiple ? multiSelected.length === 0 : !singleSelected}
          >
            Confirm Answer
          </button>
        )}

        {isLocked && (
          <p className="small fst-italic mt-3 mb-0" style={{ color: "var(--theme-text-muted)" }}>
            This answer is locked and cannot be changed.
          </p>
        )}
      </div>
    </div>
  );
}