import React, { useEffect, useState } from "react";
import { api } from "../api.js";

function PlanCircles({ plan }) {
  if (!plan.oldPrice) {
    // Тариф без скидки (месячный) — просто один круг
    return (
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "#2481cc",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800 }}>{plan.price}</div>
          <div style={{ fontSize: 12 }}>руб.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
      <div
        style={{
          width: 110,
          height: 110,
          borderRadius: "50%",
          background: "#f5d90a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginRight: -20,
          zIndex: 1,
        }}
      >
        <div style={{ position: "relative", fontSize: 22, fontWeight: 800, color: "#222" }}>
          {plan.oldPrice}
          <div
            style={{
              position: "absolute",
              left: -6,
              right: -6,
              top: "50%",
              height: 2,
              background: "#ff3b30",
            }}
          />
        </div>
        <div style={{ fontSize: 11, color: "#222" }}>руб.</div>
      </div>
      <div
        style={{
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: "#2481cc",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2,
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 800 }}>{plan.price}</div>
        <div style={{ fontSize: 12 }}>руб.</div>
      </div>
    </div>
  );
}

export default function PricingPlans({ onSelect }) {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    api.get("/api/billing/plans").then((res) => setPlans(res.plans));
  }, []);

  return (
    <div>
      {plans.map((plan) => (
        <div className="card" key={plan.id} style={{ textAlign: "center" }}>
          <b>{plan.title}</b>
          <PlanCircles plan={plan} />
          {plan.save > 0 && (
            <div style={{ color: "#2e9e3f", fontWeight: 600, marginBottom: 8 }}>
              Экономия {plan.save} ₽ ({plan.savePercent}%)
            </div>
          )}
          <button className="primary" onClick={() => onSelect?.(plan)}>
            Выбрать
          </button>
        </div>
      ))}
    </div>
  );
}
