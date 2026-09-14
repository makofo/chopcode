import { prisma } from "../telegramAuth.js";
import { calculateTargets } from "../kbjuCalc.js";

// Real "chat with Chop": gathers the user's own data and answers as Chop via Groq.
// Free tier; tries several models in case one is unavailable.

const MODELS = ["openai/gpt-oss-20b", "llama-3.1-8b-instant", "openai/gpt-oss-120b"];

const PERSONA = `Ты — Чоп, милый и дружелюбный чёрный кот, личный помощник в приложении-органайзере.
Говоришь на «ты», тепло, с лёгким юмором и заботой, коротко и по делу (2–5 предложений).
Помогаешь с финансами, питанием (КБЖУ), напоминаниями и настроением.
Опирайся ТОЛЬКО на данные пользователя ниже — не выдумывай цифры, которых там нет.

Если пользователь спрашивает, что приготовить (например, из продуктов, которые есть в холодильнике),
предложи 1–2 подходящих блюда. Для каждого: коротко назови блюдо, дай простые шаги приготовления
(3–6 пунктов) и примерную КБЖУ на порцию (калории, белки, жиры, углеводы).
Если известна дневная норма или цель пользователя по КБЖУ — подбирай блюда под неё.
Готовь из того, что назвал пользователь; можно добавить базовые продукты (соль, масло, специи, яйца).

Если данных не хватает — честно скажи и предложи, что записать. Отвечай на русском.`;

function mskDayStr(d) {
  return new Date(d.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function mskTime(d) {
  return new Date(d.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 16).replace("T", " ");
}

async function groqChat(apiKey, messages) {
  let lastErr = "";
  for (const model of MODELS) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.6, max_tokens: 500, messages }),
    });
    if (res.ok) {
      const d = await res.json();
      return (d.choices?.[0]?.message?.content || "").trim();
    }
    lastErr = res.status + " " + (await res.text());
    if (res.status !== 404 && res.status !== 400) break;
  }
  throw new Error("Groq chat error: " + lastErr);
}

const GOAL_LABELS = {
  lose: "похудение",
  gain: "набор массы",
  maintain: "поддержание веса",
  custom: "свой режим",
};

export async function chatWithChop(userId, question) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set - chat is not configured");

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const today = mskDayStr(now);

  const [txs, meals, reminders, user, profile] = await Promise.all([
    prisma.transaction.findMany({ where: { userId, createdAt: { gte: monthStart } } }),
    prisma.meal.findMany({ where: { userId }, orderBy: { eatenAt: "desc" }, take: 40 }),
    prisma.reminder.findMany({ where: { userId, isDone: false }, orderBy: { dueAt: "asc" }, take: 8 }),
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findUnique({ where: { userId } }),
  ]);

  let income = 0;
  let expense = 0;
  const byCat = {};
  for (const t of txs) {
    if (t.type === "income") {
      income += t.amount;
    } else {
      expense += t.amount;
      byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    }
  }
  const topCats = Object.entries(byCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([c, s]) => `${c}: ${Math.round(s)}₽`)
    .join(", ");

  const todayMeals = meals.filter((m) => mskDayStr(new Date(m.eatenAt)) === today);
  const kcal = Math.round(todayMeals.reduce((s, m) => s + m.calories, 0));
  const mealNames = todayMeals.slice(0, 8).map((m) => m.name).join(", ");

  const rem = reminders
    .map((r) => `«${r.text}» — ${mskTime(new Date(r.dueAt))}`)
    .join("; ");

  const streak = user && user.streakLastDay ? user.streakCount || 0 : 0;

  const targets = profile ? calculateTargets(profile) : null;
  const goalLabel = profile ? GOAL_LABELS[profile.goal] || profile.goal : null;

  const ctx = [
    "Данные пользователя (текущее время по Москве: " + mskTime(now) + "):",
    `Финансы за текущий месяц: доходы ${Math.round(income)}₽, расходы ${Math.round(expense)}₽.`,
    topCats ? `Расходы по категориям: ${topCats}.` : "Трат в этом месяце пока нет.",
    goalLabel ? `Цель по питанию: ${goalLabel}.` : null,
    targets
      ? `Дневная норма КБЖУ: ${targets.calories} ккал, белки ${targets.protein}г, жиры ${targets.fat}г, углеводы ${targets.carbs}г.`
      : "Профиль КБЖУ ещё не заполнен.",
    `Сегодня съедено: ${kcal} ккал${mealNames ? ` (${mealNames})` : ""}.`,
    rem ? `Ближайшие напоминания: ${rem}.` : "Активных напоминаний нет.",
    `Серия по КБЖУ: ${streak} дн.`,
  ]
    .filter(Boolean)
    .join("\n");

  return await groqChat(apiKey, [
    { role: "system", content: PERSONA + "\n\n" + ctx },
    { role: "user", content: question },
  ]);
}
