import React from "react";

export default function Timer({ timeLeft }) {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const s = (timeLeft % 60).toString().padStart(2, "0");
  const urgent = timeLeft < 60;
  return (
    <div className={`fw-bold fs-4 ${urgent ? "text-danger" : "text-white"}`}>
      ⏱ {m}:{s}
    </div>
  );
}