import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import Reminders from "./tabs/Reminders.jsx";
import Finance from "./tabs/Finance.jsx";
import KBJU from "./tabs/KBJU.jsx";
import Diary from "./tabs/Diary.jsx";
import Assistant from "./tabs/Assistant.jsx";

// Chop avatar for the header and Premium screen (inlined; no separate image file needed)
const CHOP_AVATAR = "data:image/jpeg;base64,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";

const TABS = [
  { id: "reminders", icon: "\u23f0", label: "\u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f", Component: Reminders },
  { id: "finance", icon: "\ud83d\udcb0", label: "\u0424\u0438\u043d\u0430\u043d\u0441\u044b", Component: Finance },
  { id: "kbju", icon: "\ud83e\udd57", label: "\u041a\u0411\u0416\u0423", Component: KBJU },
  { id: "diary", icon: "\ud83d\udcd4", label: "\u0414\u043d\u0435\u0432\u043d\u0438\u043a", Component: Diary },
  { id: "assistant", icon: "\ud83d\udc08\u200d\u2b1b", label: "\u0427\u043e\u043f", Component: Assistant },
];

// Themes: preview colors for the swatches. free:false = Premium only.
const THEMES = [
  { id: "default", name: "\u0427\u0451\u0440\u043d\u043e-\u043a\u0440\u0430\u0441\u043d\u0430\u044f", free: true, bg: "#161619", line: "#3a3a42", a: "#ff3149", a2: "#ff5a6d" },
  { id: "blue", name: "\u0411\u0435\u043b\u043e-\u0433\u043e\u043b\u0443\u0431\u0430\u044f", free: true, bg: "#f6f9fc", line: "#dce4ee", a: "#2f8fff", a2: "#5aa8ff" },
  { id: "night", name: "\u041d\u043e\u0447\u044c", free: false, bg: "#1b1830", line: "#39325e", a: "#8b6dff", a2: "#a98cff" },
  { id: "pink", name: "\u0420\u043e\u0437\u043e\u0432\u0430\u044f", free: false, bg: "#fff5f9", line: "#f3d7e3", a: "#ff4d94", a2: "#ff77ac" },
];

const T = {
  themeTitle: "\u0422\u0435\u043c\u0430 \u043e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u044f",
  themeSub: "\u0412\u044b\u0431\u0435\u0440\u0438, \u043a\u0430\u043a \u0431\u0443\u0434\u0435\u0442 \u0432\u044b\u0433\u043b\u044f\u0434\u0435\u0442\u044c \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435",
  chosen: "\u0412\u044b\u0431\u0440\u0430\u043d\u0430",
  premium: "Premium",
  free: "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u043e",
  lock: "\ud83d\udd12 PRO",
  hello: "\u041f\u0440\u0438\u0432\u0435\u0442",
  online: "\u0427\u043e\u043f \u043d\u0430 \u0441\u0432\u044f\u0437\u0438 \ud83d\udc3e",
  premSub: "\u041f\u043e\u043b\u043d\u044b\u0439 \u0427\u043e\u043f \u0431\u0435\u0437 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0439",
  popular: "\ud83d\udd25 \u041f\u043e\u043f\u0443\u043b\u044f\u0440\u043d\u044b\u0439",
  checkout: "\u041e\u0444\u043e\u0440\u043c\u0438\u0442\u044c",
  payNote: "\u041e\u043f\u043b\u0430\u0442\u0430 \u043a\u0430\u0440\u0442\u043e\u0439 \u0447\u0435\u0440\u0435\u0437 Platega \u00b7 \u0431\u0435\u0437\u043e\u043f\u0430\u0441\u043d\u043e",
  payStub: "\u041e\u0444\u043e\u0440\u043c\u043b\u0435\u043d\u0438\u0435 \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0438 \u0441\u043a\u043e\u0440\u043e \u0431\u0443\u0434\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u043e",
  payErr: "\u041e\u043f\u043b\u0430\u0442\u0430 \u043f\u043e\u043a\u0430 \u043d\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0430, \u0441\u043a\u043e\u0440\u043e \u0434\u043e\u0431\u0430\u0432\u0438\u043c Platega.",
  once: "\u043e\u0434\u0438\u043d \u0440\u0430\u0437",
  perMonth: "\u20bd / \u043c\u0435\u0441",
  rub: "\u20bd",
  themeBtn: "\u0422\u0435\u043c\u0430",
  notifBtn: "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f",
};

const BENEFITS = [
  "\ud83c\udfa4 \u0411\u0435\u0437\u043b\u0438\u043c\u0438\u0442 \u0433\u043e\u043b\u043e\u0441",
  "\ud83d\udcac \u0427\u0430\u0442 \u0441 \u0427\u043e\u043f\u043e\u043c",
  "\ud83c\udf73 \u0420\u0435\u0446\u0435\u043f\u0442\u044b",
  "\ud83c\udfa8 \u0412\u0441\u0435 \u0442\u0435\u043c\u044b",
  "\ud83d\udce4 \u042d\u043a\u0441\u043f\u043e\u0440\u0442",
];

function SwatchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="9" cy="9" r="5.5" fill="#ff3149" />
      <circle cx="15" cy="9" r="5.5" fill="#2f8fff" fillOpacity="0.9" />
      <circle cx="12" cy="15" r="5.5" fill="#8b6dff" fillOpacity="0.9" />
    </svg>
  );
}

function ThemePicker({ current, isPremium, onPick, onClose, onNeedPremium }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="sheet-title">{T.themeTitle}</div>
        <div className="sheet-sub">{T.themeSub}</div>
        <div className="theme-grid">
          {THEMES.map((t) => {
            const active = current === t.id;
            const locked = !t.free && !isPremium;
            return (
              <div
                key={t.id}
                className={"sw " + (active ? "active" : "")}
                onClick={() => (locked ? onNeedPremium() : onPick(t.id))}
              >
                {locked && <div className="sw-lock">{T.lock}</div>}
                <div className="sw-prev" style={{ background: t.bg }}>
                  <div className="b" style={{ background: t.line }} />
                  <div className="p" style={{ background: "linear-gradient(90deg, " + t.a + ", " + t.a2 + ")" }} />
                  <div className="d" style={{ background: t.a }} />
                </div>
                <div className="sw-name">{t.name}</div>
                <div className={"sw-status " + (active ? "on" : locked ? "pro" : "free")}>
                  {active ? "\u2713 " + T.chosen : locked ? T.premium : T.free}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function planSubtitle(plan) {
  if (plan.isLifetime) return T.once;
  if (plan.months === 1) return plan.price + " " + T.perMonth;
  return Math.round(plan.price / plan.months) + " " + T.perMonth;
}

function Premium({ onClose }) {
  const [plans, setPlans] = useState([]);
  const [selected, setSelected] = useState("year");

  useEffect(() => {
    api.get("/api/billing/plans").then((res) => setPlans(res.plans || [])).catch(() => {});
  }, []);

  const current = plans.find((p) => p.id === selected);

  const pay = async () => {
    try {
      const res = await api.post("/api/billing/subscribe", { planId: selected });
      alert(res.message || T.payStub);
    } catch (e) {
      alert(T.payErr);
    }
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet prem" onClick={(e) => e.stopPropagation()}>
        <button className="prem-close" onClick={onClose}>{"\u00d7"}</button>
        <div className="grab" />
        <div className="prem-hero">
          <span className="prem-crown">{"\ud83d\udc51"}</span>
          <img className="prem-ava" src={CHOP_AVATAR} alt="Chop" />
        </div>
        <div className="prem-title">Chop <b>Premium</b></div>
        <div className="prem-sub">{T.premSub}</div>
        <div className="prem-benes">
          {BENEFITS.map((b) => (
            <div className="prem-bene" key={b}>{b}</div>
          ))}
        </div>
        {plans.map((p) => (
          <div
            key={p.id}
            className={"prem-plan " + (selected === p.id ? "on" : "")}
            onClick={() => setSelected(p.id)}
          >
            {p.id === "year" && <div className="prem-badge">{T.popular}</div>}
            <div className="prem-radio" />
            <div className="pl">
              <b>{p.title}</b>
              <span>{planSubtitle(p)}</span>
            </div>
            <div className="pr">
              <div className="now">{p.price} {T.rub}</div>
              {p.oldPrice ? <div className="old">{p.oldPrice} {T.rub}</div> : null}
              {p.savePercent ? <div className="save">{"\u2212"}{p.savePercent}%</div> : null}
            </div>
          </div>
        ))}
        <button className="prem-pay" onClick={pay}>
          {T.checkout}{current ? " \u00b7 " + current.price + " " + T.rub : ""}
        </button>
        <div className="prem-note">{T.payNote}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("reminders");
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("chop-theme") || "default"; } catch (e) { return "default"; }
  });
  const [isPremium] = useState(() => {
    try { return localStorage.getItem("chop-premium") === "1"; } catch (e) { return false; }
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);

  useEffect(() => {
    if (theme === "default") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("chop-theme", theme); } catch (e) {}
  }, [theme]);

  const ActiveComponent = TABS.find((t) => t.id === active).Component;
  const tgUser = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe
    ? window.Telegram.WebApp.initDataUnsafe.user : null;
  const name = (tgUser && tgUser.first_name) || "";

  return (
    <div>
      <header className="appbar">
        <img className="appbar-ava" src={CHOP_AVATAR} alt="Chop" />
        <div className="appbar-hi">
          {T.hello}{name ? ", " + name : ""}!
          <small>{T.online}</small>
        </div>
        <div className="appbar-btns">
          <button className="hbtn" onClick={() => setPickerOpen(true)} title={T.themeBtn}>
            <SwatchIcon />
          </button>
          <button className="pro-btn" onClick={() => setPremiumOpen(true)}>{"\u2728 PRO"}</button>
          <button className="hbtn" title={T.notifBtn}>{"\ud83d\udd14"}</button>
        </div>
      </header>

      <div className="content">
        <ActiveComponent />
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={active === t.id ? "active" : ""}
            onClick={() => setActive(t.id)}
          >
            <span className="tab-ic">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {pickerOpen && (
        <ThemePicker
          current={theme}
          isPremium={isPremium}
          onPick={(id) => { setTheme(id); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
          onNeedPremium={() => { setPickerOpen(false); setPremiumOpen(true); }}
        />
      )}
      {premiumOpen && <Premium onClose={() => setPremiumOpen(false)} />}
    </div>
  );
}
