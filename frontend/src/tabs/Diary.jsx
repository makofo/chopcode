import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useVoiceInput } from "../useVoiceInput.js";

export default function Diary() {
  const [entries, setEntries] = useState([]);
  const [text, setText] = useState("");
  const [mood, setMood] = useState("");
  const { listening, start, stop } = useVoiceInput((spoken) => setText((prev) => `${prev} ${spoken}`.trim()));

  const load = () => api.get("/api/diary").then(setEntries).catch(console.error);

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!text) return;
    await api.post("/api/diary", { text, mood });
    setText("");
    setMood("");
    load();
  };

  return (
    <div>
      <h2>Дневник мыслей</h2>
      <div className="card">
        <div style={{ display: "flex", gap: 8 }}>
          <textarea
            rows={4}
            placeholder="О чём думаешь?"
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
        <input placeholder="Настроение (необязательно)" value={mood} onChange={(e) => setMood(e.target.value)} />
        <button className="primary" onClick={add}>
          Сохранить
        </button>
      </div>

      {entries.map((e) => (
        <div className="card" key={e.id}>
          <div>{e.text}</div>
          {e.mood && <div>Настроение: {e.mood}</div>}
          <small>{new Date(e.createdAt).toLocaleString("ru-RU")}</small>
        </div>
      ))}
    </div>
  );
}
