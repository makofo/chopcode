import { prisma } from "../telegramAuth.js";

// Real "chat with Chop": gathers the user's own data and answers as Chop via Groq.
// Free tier; tries several models in case one is unavailable.

const MODELS = ["openai/gpt-oss-20b", "llama-3.1-8b-instant", "openai/gpt-oss-120b"];

const PERSONA = `\u0422\u044b \u2014 \u0427\u043e\u043f, \u043c\u0438\u043b\u044b\u0439 \u0438 \u0434\u0440\u0443\u0436\u0435\u043b\u044e\u0431\u043d\u044b\u0439 \u0447\u0451\u0440\u043d\u044b\u0439 \u043a\u043e\u0442, \u043b\u0438\u0447\u043d\u044b\u0439 \u043f\u043e\u043c\u043e\u0449\u043d\u0438\u043a \u0432 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0438-\u043e\u0440\u0433\u0430\u043d\u0430\u0439\u0437\u0435\u0440\u0435.
\u0413\u043e\u0432\u043e\u0440\u0438\u0448\u044c \u043d\u0430 \u00ab\u0442\u044b\u00bb, \u0442\u0435\u043f\u043b\u043e, \u0441 \u043b\u0451\u0433\u043a\u0438\u043c \u044e\u043c\u043e\u0440\u043e\u043c \u0438 \u0437\u0430\u0431\u043e\u0442\u043e\u0439, \u043a\u043e\u0440\u043e\u0442\u043a\u043e \u0438 \u043f\u043e \u0434\u0435\u043b\u0443 (2\u20135 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0435\u043d\u0438\u0439).
\u041f\u043e\u043c\u043e\u0433\u0430\u0435\u0448\u044c \u0441 \u0444\u0438\u043d\u0430\u043d\u0441\u0430\u043c\u0438, \u043f\u0438\u0442\u0430\u043d\u0438\u0435\u043c (\u041a\u0411\u0416\u0423), \u043d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f\u043c\u0438 \u0438 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435\u043c.
\u041e\u043f\u0438\u0440\u0430\u0439\u0441\u044f \u0422\u041e\u041b\u042c\u041a\u041e \u043d\u0430 \u0434\u0430\u043d\u043d\u044b\u0435 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f \u043d\u0438\u0436\u0435 \u2014 \u043d\u0435 \u0432\u044b\u0434\u0443\u043c\u044b\u0432\u0430\u0439 \u0446\u0438\u0444\u0440\u044b, \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u0442\u0430\u043c \u043d\u0435\u0442.
\u0415\u0441\u043b\u0438 \u0434\u0430\u043d\u043d\u044b\u0445 \u043d\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u2014 \u0447\u0435\u0441\u0442\u043d\u043e \u0441\u043a\u0430\u0436\u0438 \u0438 \u043f\u0440\u0435\u0434\u043b\u043e\u0436\u0438, \u0447\u0442\u043e \u0437\u0430\u043f\u0438\u0441\u0430\u0442\u044c. \u041e\u0442\u0432\u0435\u0447\u0430\u0439 \u043d\u0430 \u0440\u0443\u0441\u0441\u043a\u043e\u043c.`;

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
      body: JSON.stringify({ model, temperature: 0.6, max_tokens: 400, messages }),
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

export async function chatWithChop(userId, question) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set - chat is not configured");

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const today = mskDayStr(now);

  const [txs, meals, reminders, user] = await Promise.all([
    prisma.transaction.findMany({ where: { userId, createdAt: { gte: monthStart } } }),
    prisma.meal.findMany({ where: { userId }, orderBy: { eatenAt: "desc" }, take: 40 }),
    prisma.reminder.findMany({ where: { userId, isDone: false }, orderBy: { dueAt: "asc" }, take: 8 }),
    prisma.user.findUnique({ where: { id: userId } }),
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
    .map(([c, s]) => `${c}: ${Math.round(s)}\u20bd`)
    .join(", ");

  const todayMeals = meals.filter((m) => mskDayStr(new Date(m.eatenAt)) === today);
  const kcal = Math.round(todayMeals.reduce((s, m) => s + m.calories, 0));
  const mealNames = todayMeals.slice(0, 8).map((m) => m.name).join(", ");

  const rem = reminders
    .map((r) => `\u00ab${r.text}\u00bb \u2014 ${mskTime(new Date(r.dueAt))}`)
    .join("; ");

  const streak = user && user.streakLastDay ? user.streakCount || 0 : 0;

  const ctx = [
    "\u0414\u0430\u043d\u043d\u044b\u0435 \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044f (\u0442\u0435\u043a\u0443\u0449\u0435\u0435 \u0432\u0440\u0435\u043c\u044f \u043f\u043e \u041c\u043e\u0441\u043a\u0432\u0435: " + mskTime(now) + "):",
    `\u0424\u0438\u043d\u0430\u043d\u0441\u044b \u0437\u0430 \u0442\u0435\u043a\u0443\u0449\u0438\u0439 \u043c\u0435\u0441\u044f\u0446: \u0434\u043e\u0445\u043e\u0434\u044b ${Math.round(income)}\u20bd, \u0440\u0430\u0441\u0445\u043e\u0434\u044b ${Math.round(expense)}\u20bd.`,
    topCats ? `\u0420\u0430\u0441\u0445\u043e\u0434\u044b \u043f\u043e \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f\u043c: ${topCats}.` : "\u0422\u0440\u0430\u0442 \u0432 \u044d\u0442\u043e\u043c \u043c\u0435\u0441\u044f\u0446\u0435 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.",
    `\u0421\u0435\u0433\u043e\u0434\u043d\u044f \u0441\u044a\u0435\u0434\u0435\u043d\u043e: ${kcal} \u043a\u043a\u0430\u043b${mealNames ? ` (${mealNames})` : ""}.`,
    rem ? `\u0411\u043b\u0438\u0436\u0430\u0439\u0448\u0438\u0435 \u043d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f: ${rem}.` : "\u0410\u043a\u0442\u0438\u0432\u043d\u044b\u0445 \u043d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0439 \u043d\u0435\u0442.",
    `\u0421\u0435\u0440\u0438\u044f \u043f\u043e \u041a\u0411\u0416\u0423: ${streak} \u0434\u043d.`,
  ].join("\n");

  return await groqChat(apiKey, [
    { role: "system", content: PERSONA + "\n\n" + ctx },
    { role: "user", content: question },
  ]);
}
