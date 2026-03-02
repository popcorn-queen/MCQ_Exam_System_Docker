import React, { useState } from "react";

export default function QuestionPanel({ question, selected, answerQuestion, lockMultiple }) {
  const [multiSelected, setMultiSelected] = useState(selected || []);

  if (!question) return null;

  const handleSingle = (opt) => answerQuestion(question.id, opt);
  const handleMulti = (opt) => {
    if (multiSelected.includes(opt)) setMultiSelected(prev => prev.filter(o => o !== opt));
    else setMultiSelected(prev => [...prev, opt]);
  };

  const confirmMulti = () => {
    answerQuestion(question.id, multiSelected);
    lockMultiple(question.id);
  };

  return (
    <div className="flex-1 border p-4">
      <h3 className="mb-2">{question.question}</h3>
      {question.type === "single" &&
        question.options.map(opt => (
          <div key={opt} className="mb-1">
            <label className={`cursor-pointer ${selected === opt ? "font-bold" : ""}`}>
              <input
                type="radio"
                checked={selected === opt}
                disabled={selected !== undefined}
                onChange={() => handleSingle(opt)}
                className="mr-2"
              />
              {opt}
            </label>
          </div>
        ))
      }
      {question.type === "multiple" &&
        question.options.map(opt => (
          <div key={opt} className="mb-1">
            <label className={`cursor-pointer ${multiSelected.includes(opt) ? "font-bold" : ""}`}>
              <input
                type="checkbox"
                checked={multiSelected.includes(opt)}
                disabled={selected !== undefined}
                onChange={() => handleMulti(opt)}
                className="mr-2"
              />
              {opt}
            </label>
          </div>
        ))
      }
      {question.type === "multiple" && selected === undefined && (
        <button className="mt-2 bg-blue-600 text-white px-3 py-1" onClick={confirmMulti}>
          Confirm Answer
        </button>
      )}
    </div>
  );
}