import React from "react";

export default function NavigationGrid({ questions, locked, currentIndex, setCurrentIndex }) {
  return (
    <div className="w-32 grid grid-cols-4 gap-2 mr-4">
      {questions.map((q, idx) => {
        const isLocked = locked.includes(q.id);
        const isCurrent = currentIndex === idx;
        const classes = `w-8 h-8 flex items-center justify-center border rounded cursor-pointer ${
          isLocked ? "bg-blue-600 text-white" : "bg-white"
        } ${isCurrent ? "border-4 border-black" : ""}`;
        return (
          <div key={q.id} className={classes} onClick={() => setCurrentIndex(idx)}>
            {idx + 1}
          </div>
        );
      })}
    </div>
  );
}