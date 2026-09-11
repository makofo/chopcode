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

const T = {
  greeting: "\u041f\u0440\u0438\u0432\u0435\u0442! \u042f \u0427\u043e\u043f. \u0421\u043a\u0430\u0436\u0438 \u0433\u043e\u043b\u043e\u0441\u043e\u043c \u0438\u043b\u0438 \u043d\u0430\u043f\u0438\u0448\u0438 \u2014 \u044f \u043f\u043e\u0439\u043c\u0443 \u0438 \u0440\u0430\u0437\u043b\u043e\u0436\u0443 \u043f\u043e \u043c\u0435\u0441\u0442\u0430\u043c (\u043d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f, \u0444\u0438\u043d\u0430\u043d\u0441\u044b, \u041a\u0411\u0416\u0423, \u0434\u043d\u0435\u0432\u043d\u0438\u043a). \u041c\u043e\u0436\u043d\u043e \u0441\u0440\u0430\u0437\u0443 \u043d\u0435\u0441\u043a\u043e\u043b\u044c\u043a\u043e \u0434\u0435\u043b \u0432 \u043e\u0434\u043d\u043e\u043c \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0438.",
  askSoon: "\u041f\u043e\u043a\u0430 \u043d\u0435 \u043c\u043e\u0433\u0443 \u043e\u0442\u0432\u0435\u0442\u0438\u0442\u044c, \u043d\u043e \u0441\u043a\u043e\u0440\u043e \u043d\u0430\u0443\u0447\u0443\u0441\u044c!",
  askErr: "\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u043e\u0441\u044c \u043e\u0442\u0432\u0435\u0442\u0438\u0442\u044c, \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437.",
  voice: "\u0433\u043e\u043b\u043e\u0441\u043e\u0432\u043e\u0435",
  multiIntro: "\u0413\u043e\u0442\u043e\u0432\u043e! \u0420\u0430\u0437\u043b\u043e\u0436\u0438\u043b \u043f\u043e \u043c\u0435\u0441\u0442\u0430\u043c \ud83d\udc47\n",
  saved: "\u0417\u0430\u043f\u0438\u0441\u0430\u043b.",
  paywall: "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0435 \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u044b\u0435 \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c \ud83c\udf99 \u041d\u0430\u0436\u043c\u0438 \u2728 PRO \u0432\u0432\u0435\u0440\u0445\u0443, \u043e\u0444\u043e\u0440\u043c\u0438 Premium \u2014 \u0438 \u0433\u043e\u043b\u043e\u0441 \u0431\u0435\u0437 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0439.",
  micErr: "\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u043e\u0441\u044c \u0440\u0430\u0441\u043f\u043e\u0437\u043d\u0430\u0442\u044c \u0433\u043e\u043b\u043e\u0441, \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437.",
  tooShort: "\u0421\u043b\u0438\u0448\u043a\u043e\u043c \u043a\u043e\u0440\u043e\u0442\u043a\u043e. \u041d\u0430\u0436\u043c\u0438 \ud83c\udfa4, \u0441\u043a\u0430\u0436\u0438 \u0444\u0440\u0430\u0437\u0443 \u0438 \u043d\u0430\u0436\u043c\u0438 \u0435\u0449\u0451 \u0440\u0430\u0437, \u0447\u0442\u043e\u0431\u044b \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c.",
  noPerm: "\u041d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u0430 \u043a \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d\u0443. \u0420\u0430\u0437\u0440\u0435\u0448\u0438 \u0434\u043e\u0441\u0442\u0443\u043f \u0432 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430\u0445 \u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0441\u043d\u043e\u0432\u0430.",
  noMic: "\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u043e\u0441\u044c \u0432\u043a\u043b\u044e\u0447\u0438\u0442\u044c \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d. \u041f\u0440\u043e\u0432\u0435\u0440\u044c, \u0447\u0442\u043e \u043e\u043d \u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d, \u0438 \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437.",
  typing: "\u0427\u043e\u043f \u043f\u0435\u0447\u0430\u0442\u0430\u0435\u0442\u2026",
  micTitle: "\u0417\u0430\u043f\u0438\u0441\u0430\u0442\u044c \u0433\u043e\u043b\u043e\u0441",
  stopTitle: "\u041e\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c \u0438 \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c",
  placeholder: "\u0421\u043f\u0440\u043e\u0441\u0438 \u0427\u043e\u043f\u0430\u2026",
  sendTitle: "\u041e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c",
  recording: "\u0418\u0434\u0451\u0442 \u0437\u0430\u043f\u0438\u0441\u044c",
  recHint: "\u00b7 \u043d\u0430\u0436\u043c\u0438, \u0447\u0442\u043e\u0431\u044b \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c",
  mic: "\ud83c\udfa4",
  stop: "\u23f9",
  send: "\u27a4",
  check: "\u2713 ",
};

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, "0");
  return m + ":" + ss;
}

const CHAT_CSS = `
.chop-chat { display:flex; flex-direction:column; height:calc(100dvh - 152px); margin:-8px -16px 0; }
.chop-msgs { flex:1; overflow-y:auto; padding:14px 14px 6px; display:flex; flex-direction:column; gap:11px; }
.chop-row { display:flex; gap:8px; align-items:flex-end; max-width:88%; }
.chop-bot { background:var(--card); border:1px solid var(--line); border-radius:16px 16px 16px 5px; padding:10px 13px; color:var(--text); font-size:14px; line-height:1.45; white-space:pre-line; }
.chop-me { align-self:flex-end; max-width:84%; background:linear-gradient(180deg,var(--accent2),var(--accent)); color:#fff; border-radius:16px 16px 5px 16px; padding:10px 13px; font-size:14px; line-height:1.4; box-shadow:0 5px 14px var(--shadow); }
.chop-badges { display:flex; flex-wrap:wrap; gap:6px; margin-top:7px; }
.chop-badge { display:inline-block; font-size:11.5px; font-weight:700; color:var(--accent); background:var(--accentsoft); padding:4px 9px; border-radius:8px; }
.chop-chips { display:flex; flex-wrap:wrap; gap:8px; padding:2px 14px 8px; }
.chop-chip { border:1px solid var(--line); color:var(--accent); background:var(--accentsoft); border-radius:20px; padding:7px 12px; font-size:12.5px; font-weight:700; cursor:pointer; }
.chop-typing { color:var(--muted); font-size:13px; padding:2px 14px; }
.chop-inbar { display:flex; gap:8px; align-items:center; padding:10px 14px calc(12px + env(safe-area-inset-bottom)); border-top:1px solid var(--line); background:var(--bg); }
.chop-tin { flex:1; min-width:0; background:var(--inp); border:1px solid var(--line); border-radius:22px; padding:11px 15px; color:var(--text); font-size:14px; margin:0; }
.chop-recbar { flex:1; min-width:0; display:flex; align-items:center; gap:9px; background:var(--accentsoft); border:1px solid var(--accent); border-radius:22px; padding:10px 15px; color:var(--accent); font-weight:700; font-size:13px; }
.chop-recdot { width:10px; height:10px; border-radius:50%; background:var(--accent); flex:none; animation:recpulse 1s infinite; }
.chop-rechint { color:var(--muted); font-weight:600; }
@keyframes recpulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.75)} }
.chop-mic { width:44px; height:44px; flex:none; border-radius:50%; border:1px solid var(--line); background:var(--accentsoft); color:var(--accent); font-size:17px; cursor:pointer; }
.chop-mic.on { background:linear-gradient(180deg,var(--accent2),var(--accent)); color:#fff; border-color:transparent; box-shadow:0 4px 12px var(--accentsoft); }
.chop-send { width:44px; height:44px; flex:none; border-radius:50%; border:none; background:linear-gradient(180deg,var(--accent2),var(--accent)); color:#fff; font-size:18px; box-shadow:0 6px 16px var(--shadow); cursor:pointer; }
`;

export default function Assistant() {
  const { recording, start, stop, error } = useAudioRecorder();
  const [messages, setMessages] = useState([{ from: "chop", text: T.greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const endRef = useRef(null);

  const push = (m) => setMessages((prev) => [...prev, m]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, recording]);

  // Recording timer
  useEffect(() => {
    if (!recording) { setElapsed(0); return; }
    setElapsed(0);
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  // Microphone errors
  useEffect(() => {
    if (error === "no-permission") push({ from: "chop", text: T.noPerm });
    else if (error === "no-mic") push({ from: "chop", text: T.noMic });
  }, [error]);

  const send = async (text) => {
    const q = (text != null ? text : input).trim();
    if (!q || busy) return;
    push({ from: "me", text: q });
    setInput("");
    setBusy(true);
    try {
      const res = await api.post("/api/assistant/ask", { question: q });
      push({ from: "chop", text: res.answer || T.askSoon });
    } catch (e) {
      push({ from: "chop", text: T.askErr });
    } finally {
      setBusy(false);
    }
  };

  const onMic = async () => {
    if (!recording) {
      await start();
      return;
    }
    const rec = await stop();
    if (!rec || !rec.blob || rec.blob.size < 1200 || rec.durationMs < 700) {
      push({ from: "chop", text: T.tooShort });
      return;
    }
    setBusy(true);
    try {
      const res = await api.postAudio("/api/assistant/process-audio", rec.blob, "voice." + rec.ext);
      push({ from: "me", text: T.mic + " " + (res.recognizedText || T.voice) });

      const items =
        res.items && res.items.length
          ? res.items
          : res.type
          ? [{ type: res.type, human: res.human }]
          : [];

      if (items.length) {
        const tabs = [...new Set(items.map((it) => TYPE_LABELS[it.type]).filter(Boolean))];
        const body = items.map((it) => it.human).join("\n");
        const intro = items.length > 1 ? T.multiIntro : "";
        push({ from: "chop", text: intro + body, tabs });
      } else {
        push({ from: "chop", text: T.saved });
      }
    } catch (e) {
      if (e.status === 402 || String(e.message).indexOf("402") !== -1) {
        push({ from: "chop", text: T.paywall });
      } else {
        let reason = "";
        try {
          const j = JSON.parse(e.detail || "{}");
          reason = j.error || "";
        } catch (_) {}
        push({ from: "chop", text: T.micErr + (reason ? "\n(" + String(reason).slice(0, 140) + ")" : "") });
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
                {m.tabs && m.tabs.length ? (
                  <div className="chop-badges">
                    {m.tabs.map((t) => (
                      <span className="chop-badge" key={t}>{T.check + t}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )
        )}
        {busy ? <div className="chop-typing">{T.typing}</div> : null}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && !recording && (
        <div className="chop-chips">
          {CHIPS.map((c) => (
            <div className="chop-chip" key={c} onClick={() => send(c)}>{c}</div>
          ))}
        </div>
      )}

      <div className="chop-inbar">
        <button
          className={"chop-mic" + (recording ? " on" : "")}
          onClick={onMic}
          title={recording ? T.stopTitle : T.micTitle}
        >
          {recording ? T.stop : T.mic}
        </button>

        {recording ? (
          <div className="chop-recbar">
            <span className="chop-recdot" />
            <span>{T.recording + " " + fmtTime(elapsed)}</span>
            <span className="chop-rechint">{T.recHint}</span>
          </div>
        ) : (
          <>
            <input
              className="chop-tin"
              placeholder={T.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            />
            <button className="chop-send" onClick={() => send()} title={T.sendTitle}>{T.send}</button>
          </>
        )}
      </div>
    </div>
  );
}
