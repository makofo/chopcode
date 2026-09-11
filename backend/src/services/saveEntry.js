import { prisma } from "../telegramAuth.js";

// Interprets a naive datetime string (from the AI, in Moscow wall-clock time)
// as MSK (UTC+3) and returns the correct UTC Date to store. The reminder cron
// compares against UTC "now", so this makes reminders fire at the intended MSK time.
function mskWallToUtc(s) {
  const m = String(s).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return new Date(s);
  const [, Y, Mo, D, H, Mi, S] = m;
  return new Date(Date.UTC(+Y, +Mo - 1, +D, +H - 3, +Mi, +(S || 0)));
}

// Day string "YYYY-MM-DD" in Moscow time (UTC+3).
function mskDayStr(date) {
  return new Date(date.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// Bumps the meal-logging streak (same rule as the KBJU tab), so meals added by
// voice also light the streak. Non-fatal: never breaks saving the entry.
async function bumpStreak(userId) {
  try {
    const now = new Date();
    const today = mskDayStr(now);
    const yest = mskDayStr(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (u && u.streakLastDay !== today) {
      const count = u.streakLastDay === yest ? (u.streakCount || 0) + 1 : 1;
      await prisma.user.update({ where: { id: userId }, data: { streakCount: count, streakLastDay: today } });
    }
  } catch (e) {
    console.error("streak bump failed:", e.message);
  }
}

// Saves a structured entry (result of classifyText) into the right table.
// Returns { type, saved, human } - human is a short description for the reply.
export async function saveClassifiedEntry(userId, classified) {
  const { type, data } = classified;

  switch (type) {
    case "reminder": {
      const dueAt = mskWallToUtc(data.dueAt);
      const saved = await prisma.reminder.create({
        data: {
          userId,
          text: data.text,
          dueAt,
          repeat: data.repeat || "none",
        },
      });
      // Show the intended Moscow time back to the user.
      const when = new Date(dueAt.getTime() + 3 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 16)
        .replace("T", " ");
      return {
        type,
        saved,
        human: `\u23f0 \u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0435 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d\u043e: \u00ab${data.text}\u00bb \u043d\u0430 ${when} (\u041c\u0421\u041a)`,
      };
    }

    case "transaction": {
      const saved = await prisma.transaction.create({
        data: {
          userId,
          amount: Number(data.amount) || 0,
          category: data.category || "\u043f\u0440\u043e\u0447\u0435\u0435",
          type: data.type === "income" ? "income" : "expense",
          note: data.note || null,
        },
      });
      return {
        type,
        saved,
        human: `\ud83d\udcb0 ${data.type === "income" ? "\u0414\u043e\u0445\u043e\u0434" : "\u0420\u0430\u0441\u0445\u043e\u0434"} \u0437\u0430\u043f\u0438\u0441\u0430\u043d: ${data.amount} \u20bd (${data.category})`,
      };
    }

    case "meal": {
      const saved = await prisma.meal.create({
        data: {
          userId,
          name: data.name,
          calories: Number(data.calories) || 0,
          protein: Number(data.protein) || 0,
          fat: Number(data.fat) || 0,
          carbs: Number(data.carbs) || 0,
        },
      });
      await bumpStreak(userId);
      return {
        type,
        saved,
        human: `\ud83c\udf4e \u041f\u0440\u0438\u0451\u043c \u043f\u0438\u0449\u0438 \u0434\u043e\u0431\u0430\u0432\u043b\u0435\u043d: ${data.name} (~${data.calories} \u043a\u043a\u0430\u043b)`,
      };
    }

    case "diary":
    default: {
      const saved = await prisma.diaryEntry.create({
        data: { userId, text: data.text, mood: data.mood || null },
      });
      return { type: "diary", saved, human: `\ud83d\udcd4 \u0417\u0430\u043f\u0438\u0441\u0430\u043d\u043e \u0432 \u0434\u043d\u0435\u0432\u043d\u0438\u043a: \u00ab${data.text}\u00bb` };
    }
  }
}
