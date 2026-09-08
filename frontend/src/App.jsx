import React, { useState } from "react";
import Reminders from "./tabs/Reminders.jsx";
import Finance from "./tabs/Finance.jsx";
import KBJU from "./tabs/KBJU.jsx";
import Diary from "./tabs/Diary.jsx";
import Assistant from "./tabs/Assistant.jsx";

const TABS = [
  { id: "reminders", label: "⏰ Напоминания", Component: Reminders },
  { id: "finance", label: "💰 Финансы", Component: Finance },
  { id: "kbju", label: "🍎 КБЖУ", Component: KBJU },
  { id: "diary", label: "📔 Дневник", Component: Diary },
  { id: "assistant", label: "🤖 Ассистент", Component: Assistant },
];

export default function App() {
  const [active, setActive] = useState("reminders");
  const ActiveComponent = TABS.find((t) => t.id === active).Component;

  return (
    <div>
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
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
