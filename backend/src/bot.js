import crypto from "crypto";
import { Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";
import cron from "node-cron";
import { prisma } from "./telegramAuth.js";
import { transcribeAudio } from "./services/transcribe.js";
import { classifyText } from "./services/classify.js";
import { saveClassifiedEntry } from "./services/saveEntry.js";
import { checkVoiceAccess } from "./services/voiceQuota.js";
import { warmReminder, hourNudge, morningDigest, eveningMotivation } from "./services/chopNotify.js";

export const bot = new Telegraf(process.env.BOT_TOKEN);

// Sets the persistent menu button (next to the chat input) for one specific chat.
// Called on /start so the button appears immediately for that user, even if the
// global default has not refreshed in an already-open chat.
async function setMenuButtonForChat(ctx) {
  if (!process.env.WEBAPP_URL) return;
  try {
    await ctx.telegram.callApi("setChatMenuButton", {
      chat_id: ctx.chat.id,
      menu_button: {
        type: "web_app",
        text: "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0427\u043e\u043f\u0430",
        web_app: { url: process.env.WEBAPP_URL },
      },
    });
  } catch (e) {
    console.error("Failed to set menu button (start):", e.message);
  }
}

bot.start(async (ctx) => {
  // Generate a personal voice token once on first /start -
  // the user pastes it into their iOS Shortcut (Back Tap).
  const telegramId = String(ctx.from.id);
  let user = await prisma.user.findUnique({ where: { telegramId } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        firstName: ctx.from.first_name,
        username: ctx.from.username,
        voiceToken: crypto.randomBytes(24).toString("hex"),
      },
    });
  } else if (!user.voiceToken) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { voiceToken: crypto.randomBytes(24).toString("hex") },
    });
  }

  await setMenuButtonForChat(ctx);

  await ctx.reply(
    "\u041f\u0440\u0438\u0432\u0435\u0442! \u042f \u0427\u043e\u043f \ud83d\udc08\u200d\u2b1b \u041f\u043e\u043c\u043e\u0433\u0443 \u0441 \u043d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u044f\u043c\u0438, \u0444\u0438\u043d\u0430\u043d\u0441\u0430\u043c\u0438, \u041a\u0411\u0416\u0423 \u0438 \u0434\u043d\u0435\u0432\u043d\u0438\u043a\u043e\u043c \u2014 \u0432\u0441\u0451 \u0432 \u043e\u0434\u043d\u043e\u043c \u043c\u0435\u0441\u0442\u0435. \u0416\u043c\u0438 \u043a\u043d\u043e\u043f\u043a\u0443 \u043d\u0438\u0436\u0435 \u0438\u043b\u0438 \u00ab\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0427\u043e\u043f\u0430\u00bb \u0440\u044f\u0434\u043e\u043c \u0441 \u043f\u043e\u043b\u0435\u043c \u0432\u0432\u043e\u0434\u0430.",
    Markup.inlineKeyboard([
      Markup.button.webApp("\ud83d\udc08\u200d\u2b1b \u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0427\u043e\u043f\u0430", process.env.WEBAPP_URL),
    ])
  );
});

// Command to get the personal voice token for the iOS Shortcut
bot.command("voicetoken", async (ctx) => {
  const telegramId = String(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user?.voiceToken) {
    return ctx.reply("\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043d\u0430\u0436\u043c\u0438 /start, \u0447\u0442\u043e\u0431\u044b \u043f\u043e\u043b\u0443\u0447\u0438\u0442\u044c \u043b\u0438\u0447\u043d\u044b\u0439 \u0442\u043e\u043a\u0435\u043d.");
  }
  await ctx.reply(
    `\u0422\u0432\u043e\u0439 \u043b\u0438\u0447\u043d\u044b\u0439 \u0442\u043e\u043a\u0435\u043d \u0434\u043b\u044f Back Tap Shortcut (\u043d\u0438\u043a\u043e\u043c\u0443 \u0435\u0433\u043e \u043d\u0435 \u0434\u0430\u0432\u0430\u0439):\n\n${user.voiceToken}`
  );
});

// Manual PRO activation: "/pro <code>" grants lifetime PRO if the code matches
// the PRO_CODE env var.
bot.command("pro", async (ctx) => {
  const parts = ctx.message.text.trim().split(/\s+/);
  const code = parts[1] || "";
  if (!process.env.PRO_CODE || code !== process.env.PRO_CODE) {
    return ctx.reply("\u041d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u043a\u043e\u0434 \u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u0438.");
  }
  const telegramId = String(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return ctx.reply("\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043d\u0430\u0436\u043c\u0438 /start, \u043f\u043e\u0442\u043e\u043c \u043e\u0442\u043f\u0440\u0430\u0432\u044c /pro \u0438 \u043a\u043e\u0434.");
  await prisma.user.update({ where: { id: user.id }, data: { isLifetime: true } });
  await ctx.reply("\u0413\u043e\u0442\u043e\u0432\u043e! PRO \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d \u043d\u0430\u0432\u0441\u0435\u0433\u0434\u0430 \ud83d\udc08\u200d\u2b1b\u2764\ufe0f \u041e\u0442\u043a\u0440\u043e\u0439 \u0427\u043e\u043f\u0430 \u2014 \u0432\u0441\u0435 \u0444\u0443\u043d\u043a\u0446\u0438\u0438 \u0431\u0435\u0437 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0439.");
});

// Handles a voice/audio message sent straight to the bot chat: download the audio,
// transcribe it (Groq Whisper), classify it (may be several items), save each,
// and reply with what was recognized and where it went.
async function handleVoiceMessage(ctx, fileId) {
  const telegramId = String(ctx.from.id);
  let user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        firstName: ctx.from.first_name,
        username: ctx.from.username,
        voiceToken: crypto.randomBytes(24).toString("hex"),
      },
    });
  }

  const access = await checkVoiceAccess(user.id);
  if (!access.allowed) {
    return ctx.reply(
      "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0435 \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u044b\u0435 \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c \ud83d\ude42 \u041e\u0442\u043a\u0440\u043e\u0439 \u0427\u043e\u043f\u0430 \u0438 \u043e\u0444\u043e\u0440\u043c\u0438 PRO, \u0447\u0442\u043e\u0431\u044b \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c \u0431\u0435\u0437 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0439."
    );
  }

  await ctx.sendChatAction("typing");
  const link = await ctx.telegram.getFileLink(fileId);
  const resp = await fetch(link.href);
  const buffer = Buffer.from(await resp.arrayBuffer());

  const text = await transcribeAudio(buffer, "voice.ogg");
  const items = await classifyText(text);
  const results = [];
  for (const it of items) {
    results.push(await saveClassifiedEntry(user.id, it));
  }
  const humanAll = results.map((r) => r.human).join("\n");

  await ctx.reply(`\ud83c\udf99 \u0420\u0430\u0441\u043f\u043e\u0437\u043d\u0430\u043b: \u00ab${text}\u00bb\n\n${humanAll}`);
}

bot.on(message("voice"), (ctx) =>
  handleVoiceMessage(ctx, ctx.message.voice.file_id).catch(async (e) => {
    console.error("voice message error:", e.message);
    await ctx.reply("\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u043e\u0441\u044c \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u043e\u0435, \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437.");
  })
);

bot.on(message("audio"), (ctx) =>
  handleVoiceMessage(ctx, ctx.message.audio.file_id).catch(async (e) => {
    console.error("audio message error:", e.message);
    await ctx.reply("\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0438\u043b\u043e\u0441\u044c \u043e\u0431\u0440\u0430\u0431\u043e\u0442\u0430\u0442\u044c \u0430\u0443\u0434\u0438\u043e, \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437.");
  })
);

// --- Simple send throttler: at most ~25 messages/sec total,
// to stay under Telegram limits during mass reminder sends.
const SEND_INTERVAL_MS = 40; // ~25 msg/sec
let queue = Promise.resolve();

function throttledSend(telegramId, text) {
  queue = queue
    .then(() => new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS)))
    .then(() => bot.telegram.sendMessage(telegramId, text))
    .catch((e) => console.error("Failed to send reminder", telegramId, e.message));
  return queue;
}

// --- Moscow-time helpers (server runs in UTC) ---
function mskDayStr(d) {
  return new Date(d.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
function mskHm(d) {
  return new Date(d.getTime() + 3 * 60 * 60 * 1000).toISOString().slice(11, 16);
}
// UTC instant of the end of "today" in Moscow time.
function endOfMskDayUtc(now) {
  const day = mskDayStr(now); // YYYY-MM-DD
  const [Y, M, D] = day.split("-").map(Number);
  // 24:00 MSK == 21:00 UTC same date
  return new Date(Date.UTC(Y, M - 1, D, 21, 0, 0));
}

// Morning digest (~10:00 MSK): warm summary of today's remaining reminders.
async function sendMorningDigests() {
  const now = new Date();
  const dayEnd = endOfMskDayUtc(now);
  const users = await prisma.user.findMany();
  for (const u of users) {
    const items = await prisma.reminder.findMany({
      where: { userId: u.id, isDone: false, dueAt: { gte: now, lt: dayEnd } },
      orderBy: { dueAt: "asc" },
      take: 10,
    });
    if (!items.length) continue;
    const lines = items.map((r) => `${mskHm(r.dueAt)} \u2014 ${r.text}`);
    const text = await morningDigest(lines, u.firstName || "");
    throttledSend(u.telegramId, text);
  }
}

// Evening motivation (~20:00 MSK): calories result + streak, only for users active today.
async function sendEveningMotivation() {
  const now = new Date();
  const today = mskDayStr(now);
  const yest = mskDayStr(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const users = await prisma.user.findMany();
  for (const u of users) {
    const meals = await prisma.meal.findMany({
      where: { userId: u.id },
      orderBy: { eatenAt: "desc" },
      take: 40,
    });
    const todayMeals = meals.filter((m) => mskDayStr(new Date(m.eatenAt)) === today);
    const alive = u.streakLastDay === today || u.streakLastDay === yest;
    const streak = alive ? u.streakCount || 0 : 0;
    if (!todayMeals.length && !streak) continue; // don't ping inactive users
    const kcal = Math.round(todayMeals.reduce((s, m) => s + m.calories, 0));
    const summary = `\u0441\u0435\u0433\u043e\u0434\u043d\u044f \u0437\u0430\u043f\u0438\u0441\u0430\u043d\u043e ${kcal} \u043a\u043a\u0430\u043b \u0437\u0430 ${todayMeals.length} \u043f\u0440\u0438\u0451\u043c(\u043e\u0432), \u0441\u0435\u0440\u0438\u044f ${streak} \u0434\u043d.`;
    const text = await eveningMotivation(summary);
    throttledSend(u.telegramId, text);
  }
}

// Every minute: fire due reminders (warm) and send "1 hour before" nudges.
export function startReminderCron() {
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    const due = await prisma.reminder.findMany({
      where: { isDone: false, dueAt: { lte: now } },
      include: { user: true },
      take: 200,
    });
    for (const r of due) {
      const text = await warmReminder(r.text);
      throttledSend(r.user.telegramId, text);

      if (r.repeat === "daily") {
        const next = new Date(r.dueAt);
        next.setDate(next.getDate() + 1);
        await prisma.reminder.update({ where: { id: r.id }, data: { dueAt: next, preNotified: false } });
      } else if (r.repeat === "weekly") {
        const next = new Date(r.dueAt);
        next.setDate(next.getDate() + 7);
        await prisma.reminder.update({ where: { id: r.id }, data: { dueAt: next, preNotified: false } });
      } else {
        await prisma.reminder.update({ where: { id: r.id }, data: { isDone: true } });
      }
    }

    // "1 hour before" nudge (once per reminder)
    const soon = new Date(now.getTime() + 60 * 60 * 1000);
    const upcoming = await prisma.reminder.findMany({
      where: { isDone: false, preNotified: false, dueAt: { gt: now, lte: soon } },
      include: { user: true },
      take: 200,
    });
    for (const r of upcoming) {
      const text = await hourNudge(r.text);
      throttledSend(r.user.telegramId, text);
      await prisma.reminder.update({ where: { id: r.id }, data: { preNotified: true } });
    }
  });

  // Morning digest at 10:00 Moscow time
  cron.schedule("0 10 * * *", () => sendMorningDigests().catch((e) => console.error("morning digest error:", e.message)), {
    timezone: "Europe/Moscow",
  });

  // Evening motivation at 20:00 Moscow time
  cron.schedule("0 20 * * *", () => sendEveningMotivation().catch((e) => console.error("evening motivation error:", e.message)), {
    timezone: "Europe/Moscow",
  });
}
