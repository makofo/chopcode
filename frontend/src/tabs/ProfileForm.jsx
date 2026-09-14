import React, { useState } from "react";
import { api } from "../api.js";

const ACTIVITY_LABELS = {
  sedentary: "Сидячий образ жизни",
  light: "Лёгкая (1–3 тренировки/нед)",
  moderate: "Умеренная (3–5 тренировок/нед)",
  active: "Высокая (6–7 тренировок/нед)",
  very_active: "Очень высокая + физ. работа",
};

const GOAL_LABELS = {
  lose: "Похудение",
  gain: "Набор массы",
  maintain: "Поддержание веса",
  custom: "Свой режим",
};

export default function ProfileForm({ initial, onSaved }) {
  const [form, setForm] = useState(
    initial ?? {
      gender: "male",
      age: "",
      heightCm: "",
      weightKg: "",
      activity: "moderate",
      goal: "lose",
      customCalories: "",
      customProtein: "",
      customFat: "",
      customCarbs: "",
    }
  );

  const isCustom = form.goal === "custom";

  const save = async () => {
    if (isCustom) {
      if (!form.customCalories) return;
    } else if (!form.age || !form.heightCm || !form.weightKg) {
      return;
    }
    const res = await api.post("/api/profile", form);
    onSaved(res);
  };

  return (
    <div className="card">
      <h3>Твои параметры</h3>

      <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
        {Object.entries(GOAL_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>

      {isCustom ? (
        <>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "6px 0 2px" }}>
            Задай свои дневные нормы вручную:
          </p>
          <input
            placeholder="Калории, ккал"
            type="number"
            value={form.customCalories}
            onChange={(e) => setForm({ ...form, customCalories: e.target.value })}
          />
          <input
            placeholder="Белки, г"
            type="number"
            value={form.customProtein}
            onChange={(e) => setForm({ ...form, customProtein: e.target.value })}
          />
          <input
            placeholder="Жиры, г"
            type="number"
