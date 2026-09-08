import React from "react";

export default function ProgressBar({ label, current, target, unit }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const over = target > 0 && current > target;

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
        <span>{label}</span>
        <span>
          {Math.round(current)} / {target} {unit}
        </span>
      </div>
      <div style={{ background: "#eee", borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: over ? "#ff4d4f" : "#2481cc",
            transition: "width 0.2s",
          }}
        />
      </div>
    </div>
  );
}
