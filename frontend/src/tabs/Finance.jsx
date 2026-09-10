import React, { useEffect, useState } from "react";
import { api } from "../api.js";
import { useVoiceInput } from "../useVoiceInput.js";

const S = {
  title: "\u0424\u0438\u043d\u0430\u043d\u0441\u044b",
  balance: "\u0411\u0430\u043b\u0430\u043d\u0441",
  income: "\u0414\u043e\u0445\u043e\u0434",
  expense: "\u0420\u0430\u0441\u0445\u043e\u0434",
  incomes: "\u0414\u043e\u0445\u043e\u0434\u044b",
  expenses: "\u0420\u0430\u0441\u0445\u043e\u0434\u044b",
  amountPh: "\u0421\u0443\u043c\u043c\u0430",
  catPh: "\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f (\u0438\u043b\u0438 \u0432\u044b\u0431\u0435\u0440\u0438 \u043d\u0438\u0436\u0435)",
  add: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c",
  empty: "\u041f\u043e\u043a\u0430 \u043d\u0435\u0442 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0439. \u0414\u043e\u0431\u0430\u0432\u044c \u043f\u0435\u0440\u0432\u0443\u044e!",
  today: "\u0421\u0435\u0433\u043e\u0434\u043d\u044f",
  yesterday: "\u0412\u0447\u0435\u0440\u0430",
  rub: "\u20bd",
  minus: "\u2212",
  del: "\u00d7",
  mic: "\ud83c\udfa4",
  voice: "\u0413\u043e\u043b\u043e\u0441\u043e\u043c",
  remove: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c",
};

const EXP_CATS = [
  { ic: "\ud83c\udf54", name: "\u0415\u0434\u0430" },
  { ic: "\ud83d\uded2", name: "\u041f\u0440\u043e\u0434\u0443\u043a\u0442\u044b" },
  { ic: "\u2615", name: "\u041a\u0430\u0444\u0435" },
  { ic: "\ud83d\ude95", name: "\u0422\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442" },
  { ic: "\ud83c\udfe0", name: "\u0414\u043e\u043c" },
  { ic: "\ud83d\udc8a", name: "\u0417\u0434\u043e\u0440\u043e\u0432\u044c\u0435" },
  { ic: "\ud83d\udc55", name: "\u041e\u0434\u0435\u0436\u0434\u0430" },
  { ic: "\ud83c\udfae", name: "\u0414\u043e\u0441\u0443\u0433" },
  { ic: "\ud83d\udcf1", name: "\u0421\u0432\u044f\u0437\u044c" },
  { ic: "\ud83d\udcb8", name: "\u0414\u0440\u0443\u0433\u043e\u0435" },
];

const INC_CATS = [
  { ic: "\ud83d\udcb0", name: "\u0417\u0430\u0440\u043f\u043b\u0430\u0442\u0430" },
  { ic: "\ud83d\udee0", name: "\u041f\u043e\u0434\u0440\u0430\u0431\u043e\u0442\u043a\u0430" },
  { ic: "\ud83c\udf81", name: "\u041f\u043e\u0434\u0430\u0440\u043e\u043a" },
  { ic: "\u21a9\ufe0f", name: "\u0412\u043e\u0437\u0432\u0440\u0430\u0442" },
  { ic: "\u2795", name: "\u0414\u0440\u0443\u0433\u043e\u0435" },
];

const ICONS = {};
EXP_CATS.concat(INC_CATS).forEach((c) => (ICONS[c.name.toLowerCase()] = c.ic));
function iconFor(cat, type) {
  const k = (cat || "").toLowerCase().trim();
  if (ICONS[k]) return ICONS[k];
  return type === "income" ? "\ud83d\udcb0" : "\ud83d\udcb8";
}

function fmt(n) {
  return Number(n).toLocaleString("ru-RU");
}

function dayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, now)) return S.today;
  if (sameDay(d, y)) return S.yesterday;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

const CSS = `
.fin-h { font-family:"Fredoka",sans-serif; font-weight:700; font-size:22px; margin:2px 4px 12px; color:var(--text); }
.fin-bal { background:linear-gradient(135deg,var(--card),var(--card2)); border:1px solid var(--line);
  border-radius:20px; padding:18px 18px 16px; box-shadow:0 6px 18px var(--shadow); margin-bottom:14px; }
.fin-bal-lbl { font-size:13px; color:var(--muted); font-weight:700; letter-spacing:.3px; }
.fin-bal-num { font-family:"Fredoka",sans-serif; font-weight:700; font-size:34px; line-height:1.1; margin-top:2px; color:var(--text); }
.fin-bal-row { display:flex; gap:10px; margin-top:14px; }
.fin-pill { flex:1; background:var(--inp); border-radius:13px; padding:9px 11px; }
.fin-pill .t { font-size:11px; color:var(--muted); font-weight:700; }
.fin-pill .v { font-size:16px; font-weight:800; margin-top:1px; }
.fin-pos { color:var(--green); }
.fin-neg { color:var(--accent); }

.fin-card { background:var(--card); border:1px solid var(--line); border-radius:20px; padding:14px; box-shadow:0 4px 14px var(--shadow); margin-bottom:14px; }
.fin-seg { display:flex; background:var(--inp); border-radius:14px; padding:4px; gap:4px; margin-bottom:12px; }
.fin-seg button { flex:1; border:0; background:transparent; color:var(--muted); font-weight:800; font-size:15px;
  padding:10px 0; border-radius:11px; cursor:pointer; font-family:inherit; transition:.15s; }
.fin-seg button.on-exp { background:var(--accent); color:#fff; box-shadow:0 3px 10px var(--accentsoft); }
.fin-seg button.on-inc { background:var(--green); color:#fff; }

.fin-amt { position:relative; margin-bottom:12px; }
.fin-amt input { width:100%; border:1px solid var(--line); background:var(--inp); color:var(--text);
  border-radius:14px; padding:14px 44px 14px 16px; font-size:22px; font-weight:800; font-family:"Fredoka",sans-serif; outline:none; }
.fin-amt .cur { position:absolute; right:16px; top:50%; transform:translateY(-50%); color:var(--muted); font-weight:800; font-size:18px; }

.fin-chips { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
.fin-chip { display:flex; align-items:center; gap:6px; border:1px solid var(--line); background:var(--inp);
  color:var(--text); border-radius:999px; padding:8px 12px; font-size:13px; font-weight:700; cursor:pointer; transition:.12s; }
.fin-chip.sel { border-color:var(--accent); background:var(--accentsoft); color:var(--accent); }
.fin-chip .e { font-size:15px; }

.fin-catrow { display:flex; gap:8px; margin-bottom:12px; }
.fin-catrow input { flex:1; min-width:0; border:1px solid var(--line); background:var(--inp); color:var(--text);
  border-radius:14px; padding:12px 14px; font-size:14px; outline:none; }
.fin-mic { flex:none; width:46px; border:0; border-radius:14px; background:var(--accentsoft); color:var(--accent);
  font-size:18px; cursor:pointer; }
.fin-mic.rec { background:var(--accent); color:#fff; animation:finpulse 1s infinite; }
@keyframes finpulse { 0%,100%{opacity:1} 50%{opacity:.55} }

.fin-add { width:100%; border:0; border-radius:15px; padding:14px; font-size:16px; font-weight:800; color:#fff;
  cursor:pointer; font-family:"Fredoka",sans-serif; }
.fin-add.exp { background:linear-gradient(135deg,var(--accent),var(--accent2)); }
.fin-add.inc { background:linear-gradient(135deg,var(--green),var(--green)); }
.fin-add:disabled { opacity:.45; }

.fin-list { display:flex; flex-direction:column; gap:9px; }
.fin-op { display:flex; align-items:center; gap:11px; background:var(--card); border:1px solid var(--line);
  border-radius:16px; padding:11px 12px; }
.fin-ic { width:40px; height:40px; flex:none; border-radius:12px; background:var(--inp); display:flex;
  align-items:center; justify-content:center; font-size:19px; }
.fin-mid { flex:1; min-width:0; }
.fin-cat { font-weight:800; font-size:14px; color:var(--text); }
.fin-date { font-size:12px; color:var(--dim); margin-top:1px; }
.fin-sum { font-weight:800; font-size:16px; font-family:"Fredoka",sans-serif; white-space:nowrap; }
.fin-del { flex:none; border:0; background:transparent; color:var(--dim); font-size:18px; cursor:pointer; padding:2px 4px; margin-left:2px; }
.fin-empty { text-align:center; color:var(--muted); padding:26px 10px; font-size:14px; }
`;

export default function Finance() {
  const [data, setData] = useState({ transactions: [], balance: 0 });
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("expense");
  const { listening, start, stop } = useVoiceInput((text) => setCategory(text));
  const supported =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);
  const toggle = () => (listening ? stop() : start());

  const load = () => api.get("/api/finance").then(setData).catch(console.error);
  useEffect(() => { load(); }, []);

  const cats = type === "expense" ? EXP_CATS : INC_CATS;

  const add = async () => {
    if (!amount || !category) return;
    await api.post("/api/finance", { amount: Number(amount), category, type });
    setAmount("");
    setCategory("");
    load();
  };

  const del = async (id) => {
    await api.del("/api/finance/" + id);
    load();
  };

  const incomeSum = data.transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const expenseSum = data.transactions
    .filter((t) => t.type !== "income")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <style>{CSS}</style>
      <div className="fin-h">{S.title}</div>

      <div className="fin-bal">
        <div className="fin-bal-lbl">{S.balance}</div>
        <div className="fin-bal-num">{fmt(data.balance.toFixed(0))} {S.rub}</div>
        <div className="fin-bal-row">
          <div className="fin-pill">
            <div className="t">{S.incomes}</div>
            <div className="v fin-pos">+{fmt(incomeSum)} {S.rub}</div>
          </div>
          <div className="fin-pill">
            <div className="t">{S.expenses}</div>
            <div className="v fin-neg">{S.minus}{fmt(expenseSum)} {S.rub}</div>
          </div>
        </div>
      </div>

      <div className="fin-card">
        <div className="fin-seg">
          <button
            className={type === "expense" ? "on-exp" : ""}
            onClick={() => { setType("expense"); setCategory(""); }}
          >
            {S.expense}
          </button>
          <button
            className={type === "income" ? "on-inc" : ""}
            onClick={() => { setType("income"); setCategory(""); }}
          >
            {S.income}
          </button>
        </div>

        <div className="fin-amt">
          <input
            type="number"
            inputMode="numeric"
            placeholder={S.amountPh}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <span className="cur">{S.rub}</span>
        </div>

        <div className="fin-chips">
          {cats.map((c) => (
            <button
              key={c.name}
              className={"fin-chip" + (category === c.name ? " sel" : "")}
              onClick={() => setCategory(c.name)}
            >
              <span className="e">{c.ic}</span>
              {c.name}
            </button>
          ))}
        </div>

        <div className="fin-catrow">
          <input
            placeholder={S.catPh}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          {supported && (
            <button
              className={"fin-mic" + (listening ? " rec" : "")}
              onClick={toggle}
              title={S.voice}
            >
              {S.mic}
            </button>
          )}
        </div>

        <button
          className={"fin-add " + (type === "income" ? "inc" : "exp")}
          onClick={add}
          disabled={!amount || !category}
        >
          {S.add}
        </button>
      </div>

      <div className="fin-list">
        {data.transactions.length === 0 && <div className="fin-empty">{S.empty}</div>}
        {data.transactions.map((t) => (
          <div className="fin-op" key={t.id}>
            <div className="fin-ic">{iconFor(t.category, t.type)}</div>
            <div className="fin-mid">
              <div className="fin-cat">{t.category}</div>
              <div className="fin-date">{dayLabel(t.createdAt)}</div>
            </div>
            <div className={"fin-sum " + (t.type === "income" ? "fin-pos" : "fin-neg")}>
              {t.type === "income" ? "+" : S.minus}{fmt(t.amount)} {S.rub}
            </div>
            <button className="fin-del" onClick={() => del(t.id)} title={S.remove}>{S.del}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
