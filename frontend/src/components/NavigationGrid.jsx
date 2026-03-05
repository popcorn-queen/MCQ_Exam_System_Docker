import React from "react";

export default function NavigationGrid({ questions, locked, currentIndex, setCurrentIndex }) {
  return (
    <div className="d-flex flex-wrap gap-2">
      {questions.map((q, idx) => {
        const isLocked = locked.includes(q.id);
        const isCurrent = currentIndex === idx;
        let variant = "outline-secondary";
        if (isLocked) variant = "primary";
        else if (isCurrent) variant = "warning";
        return (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            className={`btn btn-${variant} btn-sm`}
            style={{ width: 38, height: 38, padding: 0, fontWeight: 600 }}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
}