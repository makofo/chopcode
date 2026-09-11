import crypto from "crypto";
import { Telegraf, Markup } from "telegraf";
import cron from "node-cron";
import { prisma } from "./telegramAuth.js";

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
// the PRO_CODE env var. Includes a temporary diagnostic on mismatch.
bot.command("pro", async (ctx) => {
  const parts = ctx.message.text.trim().split(/\s+/);
  const code = parts[1] || "";
  const envSet = typeof process.env.PRO_CODE === "string" && process.env.PRO_CODE.length > 0;
  const envLen = envSet ? process.env.PRO_CODE.length : 0;
  const match = envSet && code === process.env.PRO_CODE;

  if (!match) {
    return ctx.reply(
      "\u0414\u0438\u0430\u0433\u043d\u043e\u0441\u0442\u0438\u043a\u0430 \u0430\u043a\u0442\u0438\u0432\u0430\u0446\u0438\u0438:\n" +
        "- PRO_CODE \u0437\u0430\u0434\u0430\u043d \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435: " + (envSet ? "\u0434\u0430" : "\u041d\u0415\u0422") + "\n" +
        "- \u0434\u043b\u0438\u043d\u0430 \u043a\u043e\u0434\u0430 \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435: " + envLen + "\n" +
        "- \u0434\u043b\u0438\u043d\u0430 \u0432\u0432\u0435\u0434\u0451\u043d\u043d\u043e\u0433\u043e \u043a\u043e\u0434\u0430: " + code.length + "\n" +
        "- \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u044e\u0442: " + (match ? "\u0434\u0430" : "\u043d\u0435\u0442")
    );
  }

  const telegramId = String(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return ctx.reply("\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u043d\u0430\u0436\u043c\u0438 /start, \u043f\u043e\u0442\u043e\u043c \u043e\u0442\u043f\u0440\u0430\u0432\u044c /pro \u0438 \u043a\u043e\u0434.");
  await prisma.user.update({ where: { id: user.id }, data: { isLifetime: true } });
  await ctx.reply("\u0413\u043e\u0442\u043e\u0432\u043e! PRO \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d \u043d\u0430\u0432\u0441\u0435\u0433\u0434\u0430 \ud83d\udc08\u200d\u2b1b\u2764\ufe0f \u041e\u0442\u043a\u0440\u043e\u0439 \u0427\u043e\u043f\u0430 \u2014 \u0432\u0441\u0435 \u0444\u0443\u043d\u043a\u0446\u0438\u0438 \u0431\u0435\u0437 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0439.");
});

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

// Every minute: check which reminders are due and send them.
export function startReminderCron() {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const due = await prisma.reminder.findMany({
      where: { isDone: false, dueAt: { lte: now } },
      include: { user: true },
      take: 500,
    });

    for (const r of due) {
      throttledSend(r.user.telegramId, `\u23f0 \u041d\u0430\u043f\u043e\u043c\u0438\u043d\u0430\u043d\u0438\u0435: ${r.text}`);

      if (r.repeat === "daily") {
        const next = new Date(r.dueAt);
        next.setDate(next.getDate() + 1);
        await prisma.reminder.update({ where: { id: r.id }, data: { dueAt: next } });
      } else if (r.repeat === "weekly") {
        const next = new Date(r.dueAt);
        next.setDate(next.getDate() + 7);
        await prisma.reminder.update({ where: { id: r.id }, data: { dueAt: next } });
      } else {
        await prisma.reminder.update({ where: { id: r.id }, data: { isDone: true } });
      }
    }
  });
}
