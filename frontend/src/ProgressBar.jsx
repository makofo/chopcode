import React from "react";

export default function ProgressBar({ label, current, target, unit }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const over = target > 0 && current > target;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
        <span style={{ color: "var(--text)", fontWeight: 700 }}>{label}</span>
        <span style={{ color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(current)} / {target} {unit}
        </span>
      </div>
      <div style={{ background: "var(--inp)", borderRadius: 6, height: 9, overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 6,
            background: over
              ? "linear-gradient(90deg, #ff8a00, #ff3149)"
              : "linear-gradient(90deg, var(--accent), var(--accent2))",
            transition: "width 0.2s",
          }}
        />
      </div>
    </div>
  );
}
