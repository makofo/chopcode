import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useVoiceInput } from "../useVoiceInput.js";

export default function Reminders() {
  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [dueAt, setDueAt] = useState("");
  const { listening, start, stop } = useVoiceInput((spokenText) => setText(spokenText));

  const load = () => api.get("/api/reminders").then(setItems).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!text || !dueAt) return;
    await api.post("/api/reminders", { text, dueAt, repeat: "none" });
    setText("");
    setDueAt("");
    load();
  };

  const remove = async (id) => {
    await api.del(`/api/reminders/${id}`);
    load();
  };

  return (
    <div>
      <h2>Напоминания</h2>
      <div className="card">
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="О чём напомнить?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className={`mic-btn ${listening ? "on" : ""}`}
            onClick={listening ? stop : start}
            title="Голосовой ввод"
          >
            🎤
          </button>
        </div>
        <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        <button className="primary" onClick={add}>
          Добавить
        </button>
      </div>

      {items.map((r) => (
        <div className="card" key={r.id}>
          <b>{r.text}</b>
          <div>{new Date(r.dueAt).toLocaleString("ru-RU")}</div>
          <button onClick={() => remove(r.id)}>Удалить</button>
        </div>
      ))}
    </div>
  );
}
