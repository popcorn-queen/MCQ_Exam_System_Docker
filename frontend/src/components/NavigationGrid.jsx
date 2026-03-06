import React from "react";

export default function NavigationGrid({ questions, locked, currentIndex, setCurrentIndex }) {
  return (
    <div className="d-flex flex-wrap gap-2">
      {questions.map((q, idx) => {
        const isLocked = locked.includes(q.id);
        const isCurrent = currentIndex === idx;

        let cls = "theme-nav-default";
        if (isCurrent) cls = "theme-nav-active";
        else if (isLocked) cls = "theme-nav-answered";

        return (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            className={`btn btn-sm ${cls}`}
            style={{ width: 38, height: 38, padding: 0, fontWeight: 600 }}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
}