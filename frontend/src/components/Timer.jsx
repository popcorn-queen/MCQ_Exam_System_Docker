import React from "react";
import { Timer as TimerIcon } from "@phosphor-icons/react";

export default function Timer({ timeLeft }) {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const s = (timeLeft % 60).toString().padStart(2, "0");
  const urgent = timeLeft < 60;

  return (
    <div
      className="fw-bold fs-4 d-flex align-items-center gap-2"
      style={{
        color: urgent ? "#dc3545" : "var(--theme-primary-text)",
        transition: "color 0.3s ease",
      }}
    >
      <TimerIcon size={24} weight="duotone" />
      {m}:{s}
    </div>
  );
}