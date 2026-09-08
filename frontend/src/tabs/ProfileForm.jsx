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
  maintain: "Поддержание веса",
  gain: "Набор массы",
};

export default function ProfileForm({ initial, onSaved }) {
  const [form, setForm] = useState(
    initial ?? {
      gender: "male",
      age: "",
      heightCm: "",
      weightKg: "",
      activity: "moderate",
      goal: "maintain",
    }
  );

  const save = async () => {
    if (!form.age || !form.heightCm || !form.weightKg) return;
    const res = await api.post("/api/profile", form);
    onSaved(res);
  };

  return (
    <div className="card">
      <h3>Твои параметры</h3>
      <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
        <option value="male">Мужчина</option>
        <option value="female">Женщина</option>
      </select>
      <input
        placeholder="Возраст"
        type="number"
        value={form.age}
        onChange={(e) => setForm({ ...form, age: e.target.value })}
      />
      <input
        placeholder="Рост, см"
        type="number"
        value={form.heightCm}
        onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
      />
      <input
        placeholder="Вес, кг"
        type="number"
        value={form.weightKg}
        onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
      />
      <select value={form.activity} onChange={(e) => setForm({ ...form, activity: e.target.value })}>
        {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <select value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
        {Object.entries(GOAL_LABELS).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
      <button className="primary" onClick={save}>
        Рассчитать норму
      </button>
    </div>
  );
}
