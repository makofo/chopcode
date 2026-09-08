import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import ProfileForm from "./ProfileForm.jsx";
import ProgressBar from "../ProgressBar.jsx";

export default function KBJU() {
  const [data, setData] = useState({ meals: [], totals: { calories: 0, protein: 0, fat: 0, carbs: 0 } });
  const [form, setForm] = useState({ name: "", calories: "", protein: "", fat: "", carbs: "" });
  const [profileData, setProfileData] = useState({ profile: null, targets: null });
  const [editingProfile, setEditingProfile] = useState(false);

  const loadMeals = () => api.get("/api/meals").then(setData).catch(console.error);
  const loadProfile = () => api.get("/api/profile").then(setProfileData).catch(console.error);

  useEffect(() => {
    loadMeals();
    loadProfile();
  }, []);

  const add = async () => {
    if (!form.name) return;
    await api.post("/api/meals", {
      name: form.name,
      calories: Number(form.calories) || 0,
      protein: Number(form.protein) || 0,
      fat: Number(form.fat) || 0,
      carbs: Number(form.carbs) || 0,
    });
    setForm({ name: "", calories: "", protein: "", fat: "", carbs: "" });
    loadMeals();
  };

  const onProfileSaved = (res) => {
    setProfileData(res);
    setEditingProfile(false);
  };

  const targets = profileData.targets;

  return (
    <div>
      <h2>КБЖУ сегодня</h2>

      {(!profileData.profile || editingProfile) && (
        <ProfileForm initial={profileData.profile} onSaved={onProfileSaved} />
      )}

      {targets && !editingProfile && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b>Норма на день</b>
            <button onClick={() => setEditingProfile(true)} style={{ fontSize: 12 }}>
              Изменить параметры
            </button>
          </div>
          <ProgressBar label="Калории" current={data.totals.calories} target={targets.calories} unit="ккал" />
          <ProgressBar label="Белки" current={data.totals.protein} target={targets.protein} unit="г" />
          <ProgressBar label="Жиры" current={data.totals.fat} target={targets.fat} unit="г" />
          <ProgressBar label="Углеводы" current={data.totals.carbs} target={targets.carbs} unit="г" />
        </div>
      )}

      <div className="card">
        <input
          placeholder="Что съел(а)?"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Ккал"
          type="number"
          value={form.calories}
          onChange={(e) => setForm({ ...form, calories: e.target.value })}
        />
        <input
          placeholder="Белки, г"
          type="number"
          value={form.protein}
          onChange={(e) => setForm({ ...form, protein: e.target.value })}
        />
        <input
          placeholder="Жиры, г"
          type="number"
          value={form.fat}
          onChange={(e) => setForm({ ...form, fat: e.target.value })}
        />
        <input
          placeholder="Углеводы, г"
          type="number"
          value={form.carbs}
          onChange={(e) => setForm({ ...form, carbs: e.target.value })}
        />
        <button className="primary" onClick={add}>
          Добавить приём пищи
        </button>
      </div>

      {data.meals.map((m) => (
        <div className="card" key={m.id}>
          <b>{m.name}</b> — {m.calories} ккал (Б{m.protein}/Ж{m.fat}/У{m.carbs})
        </div>
      ))}
    </div>
  );
}
