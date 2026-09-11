import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import Reminders from "./tabs/Reminders.jsx";
import Finance from "./tabs/Finance.jsx";
import KBJU from "./tabs/KBJU.jsx";
import Diary from "./tabs/Diary.jsx";
import Assistant from "./tabs/Assistant.jsx";

// Chop avatar for the header and Premium screen; Chop icon for the "Chop" tab (inlined, no image files needed)
const CHOP_AVATAR = "data:image/jpeg;base64,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";
const CHOP_ICON = "data:image/png;base64,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";

const TABS = [
  { id: "reminders", icon: "\u23f0", label: "\u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f", Component: Reminders },
  { id: "finance", icon: "\ud83d\udcb0", label: "\u0424\u0438\u043d\u0430\u043d\u0441\u044b", Component: Finance },
  { id: "kbju", icon: "\ud83e\udd57", label: "\u041a\u0411\u0416\u0423", Component: KBJU },
  { id: "diary", icon: "\ud83d\udcd4", label: "\u0414\u043d\u0435\u0432\u043d\u0438\u043a", Component: Diary },
  { id: "assistant", icon: "\ud83d\udc08\u200d\u2b1b", label: "\u0427\u043e\u043f", Component: Assistant },
];

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
  const [isPremium, setIsPremium] = useState(() => {
    try { return localStorage.getItem("chop-premium") === "1"; } catch (e) { return false; }
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);

  // Ask the backend whether this user really has PRO (lifetime / active subscription),
  // so premium themes unlock automatically after /pro, not just from a local flag.
  useEffect(() => {
    api.get("/api/billing/me")
      .then((r) => {
        setIsPremium(!!r.isPremium);
        try { localStorage.setItem("chop-premium", r.isPremium ? "1" : "0"); } catch (e) {}
      })
      .catch(() => {});
  }, []);

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
        {TABS.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              className={on ? "active" : ""}
              onClick={() => setActive(t.id)}
            >
              <span className="tab-ic">
                {t.id === "assistant" ? (
                  <img
                    src={CHOP_ICON}
                    alt="Chop"
                    style={{
                      width: 24, height: 24, borderRadius: "50%",
                      objectFit: "cover", display: "block",
                      boxShadow: on ? "0 0 0 2px var(--accent)" : "none",
                    }}
                  />
                ) : (
                  t.icon
                )}
              </span>
              {t.label}
            </button>
          );
        })}
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
