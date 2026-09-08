import React, { useState } from "react";
import { api } from "../api.js";
import { useAudioRecorder } from "../useAudioRecorder.js";
import PricingPlans from "./PricingPlans.jsx";

const TYPE_LABELS = {
  reminder: "⏰ Напоминания",
  transaction: "💰 Финансы",
  meal: "🍎 КБЖУ",
  diary: "📔 Дневник",
};

export default function Assistant() {
  const { recording, start, stop } = useAudioRecorder();
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleMic = async () => {
    setError(null);
    setResult(null);
    setShowPaywall(false);
    if (!recording) {
      await start();
      return;
    }
    const blob = await stop();
    if (!blob) return;

    setProcessing(true);
    try {
      const res = await api.postAudio("/api/assistant/process-audio", blob);
      setResult(res);
    } catch (e) {
      // 402 — бесплатные голосовые закончились, показываем тарифы вместо ошибки
      if (String(e.message).includes("402")) {
        setShowPaywall(true);
      } else {
        setError("Не получилось распознать голос. Попробуй ещё раз.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const selectPlan = async (plan) => {
    const res = await api.post("/api/billing/subscribe", { planId: plan.id });
    alert(res.message || "Оформление подписки скоро будет доступно");
  };

  const ask = async () => {
    if (!question) return;
    const res = await api.post("/api/assistant/ask", { question });
    setAnswer(res.answer);
  };

  return (
    <div>
      <h2>ИИ-ассистент</h2>
      <p style={{ opacity: 0.7 }}>
        Скажи что угодно — «напомни завтра в 9 позвонить маме», «потратил 500 на обед»,
        «съел тарелку гречки с курицей», просто мысль вслух — ассистент сам поймёт,
        куда это положить. Первые 2 голосовых — бесплатно.
      </p>

      {!showPaywall && (
        <div className="card" style={{ textAlign: "center" }}>
          <button
            className={`mic-btn ${recording ? "on" : ""}`}
            style={{ width: 64, height: 64, fontSize: 24 }}
            onClick={handleMic}
            disabled={processing}
          >
            🎤
          </button>
          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
            {processing
              ? "Распознаю и раскладываю..."
              : recording
              ? "Идёт запись — нажми ещё раз, чтобы остановить"
              : "Нажми и скажи"}
          </div>
        </div>
      )}

      {error && <div className="card" style={{ color: "#ff4d4f" }}>{error}</div>}

      {result && (
        <div className="card">
          <div style={{ opacity: 0.7, fontSize: 13 }}>Распознано:</div>
          <div style={{ marginBottom: 8 }}>«{result.recognizedText}»</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>Сохранено в: {TYPE_LABELS[result.type]}</div>
          <div>{result.human}</div>
          {typeof result.remainingFree === "number" && (
            <div style={{ marginTop: 8, fontSize: 12, opacity: 0.6 }}>
              Осталось бесплатных голосовых: {result.remainingFree}
            </div>
          )}
        </div>
      )}

      {showPaywall && (
        <div>
          <div className="card" style={{ textAlign: "center" }}>
            <b>Бесплатные голосовые закончились 🎙</b>
            <p style={{ opacity: 0.7, fontSize: 13 }}>
              Оформи подписку — и без ограничений на голосовые сообщения.
            </p>
          </div>
          <PricingPlans onSelect={selectPlan} />
        </div>
      )}

      <hr style={{ margin: "20px 0", border: "none", borderTop: "1px solid #eee" }} />

      <h3>Спросить про свои записи (текстом)</h3>
      <div className="card">
        <input
          placeholder="Спроси что-нибудь..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button className="primary" onClick={ask}>
          Спросить
        </button>
      </div>
      {answer && <div className="card">{answer}</div>}
    </div>
  );
}
