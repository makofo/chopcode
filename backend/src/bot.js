import crypto from "crypto";
import { Telegraf, Markup } from "telegraf";
import cron from "node-cron";
import { prisma } from "./telegramAuth.js";

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(async (ctx) => {
  // Генерируем личный voice-токен один раз при первом /start —
  // именно его пользователь пропишет в своём iOS Shortcut (Back Tap).
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

  await ctx.reply(
    "Привет! Я твой помощник: напоминания, финансы, КБЖУ и дневник в одном месте.",
    Markup.inlineKeyboard([
      Markup.button.webApp("📱 Открыть приложение", process.env.WEBAPP_URL),
    ])
  );
});

// Команда, чтобы пользователь мог получить свой личный voice-токен для Shortcut
bot.command("voicetoken", async (ctx) => {
  const telegramId = String(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user?.voiceToken) {
    return ctx.reply("Сначала нажми /start, чтобы получить личный токен.");
  }
  await ctx.reply(
    `Твой личный токен для Back Tap Shortcut (никому его не давай):\n\n${user.voiceToken}`
  );
});

// --- Простой троттлер отправки: не более ~25 сообщений в секунду суммарно,
// чтобы не упереться в лимит Telegram при массовой рассылке напоминаний.
const SEND_INTERVAL_MS = 40; // ~25 msg/sec
let queue = Promise.resolve();

function throttledSend(telegramId, text) {
  queue = queue
    .then(() => new Promise((resolve) => setTimeout(resolve, SEND_INTERVAL_MS)))
    .then(() => bot.telegram.sendMessage(telegramId, text))
    .catch((e) => console.error("Не удалось отправить напоминание", telegramId, e.message));
  return queue;
}

// Раз в минуту проверяем, какие напоминания пора отправить.
// При росте базы пользователей этот cron стоит вынести в отдельный воркер-процесс,
// а таблицу Reminder — читать пачками (batch), не выгружая всё разом.
export function startReminderCron() {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const due = await prisma.reminder.findMany({
      where: { isDone: false, dueAt: { lte: now } },
      include: { user: true },
      take: 500, // защита от одномоментного огромного выброса
    });

    for (const r of due) {
      throttledSend(r.user.telegramId, `⏰ Напоминание: ${r.text}`);

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
