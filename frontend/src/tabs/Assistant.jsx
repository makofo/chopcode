import React, { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useAudioRecorder } from "../useAudioRecorder.js";

const TYPE_LABELS = {
  reminder: "\u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f",
  transaction: "\u0424\u0438\u043d\u0430\u043d\u0441\u044b",
  meal: "\u041a\u0411\u0416\u0423",
  diary: "\u0414\u043d\u0435\u0432\u043d\u0438\u043a",
};

const CHIPS = [
  "\u0421\u043a\u043e\u043b\u044c\u043a\u043e \u044f \u043f\u043e\u0442\u0440\u0430\u0442\u0438\u043b \u0432 \u044d\u0442\u043e\u043c \u043c\u0435\u0441\u044f\u0446\u0435?",
  "\u0427\u0442\u043e \u043f\u0440\u0438\u0433\u043e\u0442\u043e\u0432\u0438\u0442\u044c \u043d\u0430 \u0443\u0436\u0438\u043d?",
  "\u041a\u0430\u043a \u0441\u043e\u043a\u0440\u0430\u0442\u0438\u0442\u044c \u0442\u0440\u0430\u0442\u044b \u043d\u0430 \u0435\u0434\u0443?",
];

const CHAT_CSS = `
.chop-chat { display:flex; flex-direction:column; height:calc(100dvh - 152px); margin:-8px -16px 0; }
.chop-msgs { flex:1; overflow-y:auto; padding:14px 14px 6px; display:flex; flex-direction:column; gap:11px; }
.chop-row { display:flex; gap:8px; align-items:flex-end; max-width:88%; }
.chop-bot { background:var(--card); border:1px solid var(--line); border-radius:16px 16px 16px 5px; padding:10px 13px; color:var(--text); font-size:14px; line-height:1.45; }
.chop-me { align-self:flex-end; max-width:84%; background:linear-gradient(180deg,var(--accent2),var(--accent)); color:#fff; border-radius:16px 16px 5px 16px; padding:10px 13px; font-size:14px; line-height:1.4; box-shadow:0 5px 14px var(--shadow); }
.chop-badge { display:inline-block; margin-top:6px; font-size:11.5px; font-weight:700; color:var(--accent); background:var(--accentsoft); padding:4px 9px; border-radius:8px; }
.chop-chips { display:flex; flex-wrap:wrap; gap:8px; padding:2px 14px 8px; }
.chop-chip { border:1px solid var(--line); color:var(--accent); background:var(--accentsoft); border-radius:20px; padding:7px 12px; font-size:12.5px; font-weight:700; cursor:pointer; }
.chop-typing { color:var(--muted); font-size:13px; padding:2px 14px; }
.chop-inbar { display:flex; gap:8px; align-items:center; padding:10px 14px calc(12px + env(safe-area-inset-bottom)); border-top:1px solid var(--line); background:var(--bg); }
.chop-tin { flex:1; min-width:0; background:var(--inp); border:1px solid var(--line); border-radius:22px; padding:11px 15px; color:var(--text); font-size:14px; margin:0; }
.chop-mic { width:44px; height:44px; flex:none; border-radius:50%; border:1px solid var(--line); background:var(--accentsoft); color:var(--accent); font-size:17px; cursor:pointer; }
.chop-mic.on { background:linear-gradient(180deg,var(--accent2),var(--accent)); color:#fff; border-color:transparent; }
.chop-send { width:44px; height:44px; flex:none; border-radius:50%; border:none; background:linear-gradient(180deg,var(--accent2),var(--accent)); color:#fff; font-size:18px; box-shadow:0 6px 16px var(--shadow); cursor:pointer; }
`;

export default function Assistant() {
  const { recording, start, stop } = useAudioRecorder();
  const [messages, setMessages] = useState([
    { from: "chop", text: "\u041f\u0440\u0438\u0432\u0435\u0442! \u042f \u0427\u043e\u043f. \u0421\u043f\u0440\u043e\u0441\u0438 \u043c\u0435\u043d\u044f \u043f\u0440\u043e \u0442\u0440\u0430\u0442\u044b, \u0435\u0434\u0443 \u0438\u043b\u0438 \u043f\u043b\u0430\u043d\u044b \u2014 \u043f\u043e\u0441\u0447\u0438\u0442\u0430\u044e \u0438 \u043f\u043e\u0434\u0441\u043a\u0430\u0436\u0443. \u041c\u043e\u0436\u043d\u043e \u043f\u0438\u0441\u0430\u0442\u044c \u0442\u0435\u043a\u0441\u0442\u043e\u043c \u0438\u043b\u0438 \u043d\u0430\u0433\u043e\u0432\u043e\u0440\u0438\u0442\u044c \u0433\u043e\u043b\u043e\u0441\u043e\u043c." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  const push = (m) => setMessages((prev) => [...prev, m]);

  const send = async (text) => {
    const q = (text != null ? text : input).trim();
    if (!q || busy) return;
    push({ from: "me", text: q });
    setInput("");
    setBusy(true);
    try {
      const res = await api.post("/api/assistant/ask", { question: q });
      push({ from: "chop", text: res.answer || "\u041f\u043e\u043a\u0430 \u043d\u0435 \u043c\u043e\u0433\u0443 \u043e\u0442\u0432\u0435\u0442\u0438\u0442\u044c, \u043d\u043e \u0441\u043a\u043e\u0440\u043e \u043d\u0430\u0443\u0447\u0443\u0441\u044c!" });
    } catch (e) {
      push({ from: "chop", text: "\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u043e\u0441\u044c \u043e\u0442\u0432\u0435\u0442\u0438\u0442\u044c, \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437." });
    } finally {
      setBusy(false);
    }
  };

  const onMic = async () => {
    if (!recording) { await start(); return; }
    const blob = await stop();
    if (!blob) return;
    setBusy(true);
    try {
      const res = await api.postAudio("/api/assistant/process-audio", blob);
      push({ from: "me", text: "\ud83c\udfa4 " + (res.recognizedText || "\u0433\u043e\u043b\u043e\u0441\u043e\u0432\u043e\u0435") });
      push({ from: "chop", text: "\u0417\u0430\u043f\u0438\u0441\u0430\u043b \u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u043b \u0432 \u00ab" + (TYPE_LABELS[res.type] || "\u0437\u0430\u043c\u0435\u0442\u043a\u0438") + "\u00bb. " + (res.human || ""), tab: TYPE_LABELS[res.type] });
    } catch (e) {
      if (String(e.message).indexOf("402") !== -1) {
        push({ from: "chop", text: "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0435 \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u044b\u0435 \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c \ud83c\udf99 \u041d\u0430\u0436\u043c\u0438 \u2728 PRO \u0432\u0432\u0435\u0440\u0445\u0443, \u043e\u0444\u043e\u0440\u043c\u0438 Premium \u2014 \u0438 \u0433\u043e\u043b\u043e\u0441 \u0431\u0435\u0437 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0439." });
      } else {
        push({ from: "chop", text: "\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u043e\u0441\u044c \u0440\u0430\u0441\u043f\u043e\u0437\u043d\u0430\u0442\u044c \u0433\u043e\u043b\u043e\u0441, \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437." });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="chop-chat">
      <style>{CHAT_CSS}</style>
      <div className="chop-msgs">
        {messages.map((m, i) =>
          m.from === "me" ? (
            <div className="chop-me" key={i}>{m.text}</div>
          ) : (
            <div className="chop-row" key={i}>
              <div className="chop-bot">
                {m.text}
                {m.tab ? <div className="chop-badge">{"\u2713 " + m.tab}</div> : null}
              </div>
            </div>
          )
        )}
        {busy ? <div className="chop-typing">{"\u0427\u043e\u043f \u043f\u0435\u0447\u0430\u0442\u0430\u0435\u0442\u2026"}</div> : null}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="chop-chips">
          {CHIPS.map((c) => (
            <div className="chop-chip" key={c} onClick={() => send(c)}>{c}</div>
          ))}
        </div>
      )}

      <div className="chop-inbar">
        <button className={"chop-mic" + (recording ? " on" : "")} onClick={onMic} title="\u0413\u043e\u043b\u043e\u0441">{"\ud83c\udfa4"}</button>
        <input
          className="chop-tin"
          placeholder="\u0421\u043f\u0440\u043e\u0441\u0438 \u0427\u043e\u043f\u0430\u2026"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
        <button className="chop-send" onClick={() => send()} title="\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c">{"\u27a4"}</button>
      </div>
    </div>
  );
}
