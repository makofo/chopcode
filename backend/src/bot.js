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

// Where the illustrated guide images live (served from the frontend on Vercel).
// Override with GUIDE_BASE env if the domain changes.
const GUIDE_BASE = process.env.GUIDE_BASE || "https://chopcode.vercel.app";

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
        text: "Открыть Чопа",
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
    "Привет! Я Чоп 🐈‍⬛ Помогу с напоминаниями, финансами, КБЖУ и дневником — всё в одном месте. Жми кнопку ниже или «Открыть Чопа» рядом с полем ввода.\n\nМожешь наговаривать мне голосовые прямо в чат — я всё разложу. А чтобы запускать меня двойным касанием по iPhone — отправь /setup (там вся инструкция с фото).",
    Markup.inlineKeyboard([
      Markup.button.webApp("🐈‍⬛ Открыть Чопа", process.env.WEBAPP_URL),
    ])
  );
});

// Command to get the personal voice token for the iOS Shortcut
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

// Manual PRO activation: "/pro <code>" grants lifetime PRO if the code matches
// the PRO_CODE env var.
bot.command("pro", async (ctx) => {
  const parts = ctx.message.text.trim().split(/\s+/);
  const code = parts[1] || "";
  if (!process.env.PRO_CODE || code !== process.env.PRO_CODE) {
    return ctx.reply("Неверный код активации.");
  }
  const telegramId = String(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return ctx.reply("Сначала нажми /start, потом отправь /pro и код.");
  await prisma.user.update({ where: { id: user.id }, data: { isLifetime: true } });
  await ctx.reply("Готово! PRO активирован навсегда 🐈‍⬛❤️ Открой Чопа — все функции без ограничений.");
});

// Short text-only version of the iPhone guide (tap-to-copy values).
const IPHONE_GUIDE =
  "📱 <b>Голос Чопу двойным касанием по iPhone</b>\n\n" +
  "Настрой один раз — потом дважды стучишь по задней крышке телефона, говоришь, а я разложу всё по вкладкам.\n\n" +
  "<b>1. Токен.</b> Отправь мне /voicetoken и скопируй код.\n\n" +
  "<b>2. Команда</b> (приложение «Команды» / Shortcuts):\n" +
  "• Новая команда → добавь действие <b>«Записать аудио»</b>\n" +
  "• Добавь действие <b>«Получить содержимое URL»</b> и настрой:\n" +
  "   – URL: <code>https://chopcode-production.up.railway.app/voice-webhook</code>\n" +
  "   – Метод: <b>POST</b>\n" +
  "   – Заголовок: <code>X-Voice-Token</code> = твой токен из шага 1\n" +
  "   – Тело: <b>Форма</b> → поле типа <b>Файл</b> с именем <code>audio</code> = «Записанное аудио»\n" +
  "• Назови команду <b>«Чоп»</b>\n\n" +
  "<b>3. Двойное касание:</b>\n" +
  "Настройки → Универсальный доступ → Касание → <b>Касание задней панели</b> → <b>Двойное касание</b> → выбери «Чоп».\n\n" +
  "<b>4. Готово!</b> Стукни дважды по крышке, скажи фразу — я отвечу прямо здесь. 🐈‍⬛";

bot.command("iphone", async (ctx) => {
  await ctx.reply(IPHONE_GUIDE, { parse_mode: "HTML", disable_web_page_preview: true });
});

// --- Full illustrated setup guide (/setup): copy-values text + annotated photos ---

const SETUP_INTRO =
  "📱 <b>Установка голоса Чопа на iPhone</b>\n\n" +
  "Настрой один раз — потом двойным касанием по задней крышке телефона говоришь, а я всё сам разложу по вкладкам.\n\n" +
  "<b>Всё, что нужно вставить</b> (нажми на строку — скопируется):\n\n" +
  "🔗 Адрес (URL):\n<code>https://chopcode-production.up.railway.app/voice-webhook</code>\n\n" +
  "🏷 Заголовок:\n<code>X-Voice-Token</code>\n\n" +
  "📎 Имя поля:\n<code>audio</code>\n\n" +
  "🔑 Твой личный токен — команда /voicetoken\n\n" +
  "Ниже — все шаги с фото и стрелками 👇";

// Each photo of the guide, with a short caption. Images are served from the frontend.
const GUIDE_PHOTOS = [
  ["iphone_01.png", "Шаг 1. Токен: отправь /voicetoken и скопируй код"],
  ["iphone_02.png", "Шаг 2. Открой приложение «Команды» (Shortcuts)"],
  ["iphone_03.png", "Шаг 3. «+» — новая команда. Готовая — зелёная «Чоп»"],
  ["iphone_04.png", "Шаг 4. Добавь действие «Записать аудио»"],
  ["iphone_05.png", "Шаг 5. Добавь действие «Получить содержимое URL»"],
  ["iphone_06.png", "Шаг 6. URL, Метод POST, заголовок X-Voice-Token, Тело запроса = Форма, поле audio (тип Файл = «Записанное аудио»)"],
  ["iphone_07.png", "Шаг 7. Настройки → Универсальный доступ"],
  ["iphone_08.png", "Шаг 8. Касание"],
  ["iphone_09.png", "Шаг 9. Касание задней панели"],
  ["iphone_10.png", "Шаг 10. Двойное касание → выбери «Чоп»"],
  ["iphone_11.png", "Доп: команду можно вынести на экран «Домой»"],
  ["iphone_12.png", "Готово! Так выглядит настроенная команда «Чоп» ✓"],
];

function photoGroup(items) {
  return items.map(([file, caption]) => ({
    type: "photo",
    media: `${GUIDE_BASE}/${file}`,
    caption,
  }));
}

bot.command("setup", async (ctx) => {
  try {
    await ctx.reply(SETUP_INTRO, { parse_mode: "HTML", disable_web_page_preview: true });
    // Telegram allows at most 10 photos per album, so send two groups.
    await ctx.replyWithMediaGroup(photoGroup(GUIDE_PHOTOS.slice(0, 6)));
    await ctx.replyWithMediaGroup(photoGroup(GUIDE_PHOTOS.slice(6)));
    await ctx.reply(
      "Проверь: стукни дважды по задней крышке → скажи фразу → я отвечу здесь «🎙 Распознал…».\n\nЗастрял на шаге — просто напиши мне номер шага. 🐾"
    );
  } catch (e) {
    console.error("setup guide error:", e.message);
    // Fallback to the text-only guide if the photos can't be sent.
    await ctx.reply(IPHONE_GUIDE, { parse_mode: "HTML", disable_web_page_preview: true });
  }
});

// Show these commands in the bot's command menu.
bot.telegram
  .setMyCommands([
    { command: "start", description: "Открыть Чопа" },
    { command: "setup", description: "Установка голоса на iPhone (с фото)" },
    { command: "voicetoken", description: "Мой токен для iPhone-команды" },
  ])
  .catch((e) => console.error("setMyCommands failed:", e.message));

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
      "Бесплатные голосовые закончились 🙂 Открой Чопа и оформи PRO, чтобы продолжить без ограничений."
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

  await ctx.reply(`🎙 Распознал: «${text}»\n\n${humanAll}`);
}

bot.on(message("voice"), (ctx) =>
  handleVoiceMessage(ctx, ctx.message.voice.file_id).catch(async (e) => {
    console.error("voice message error:", e.message);
    await ctx.reply("Не получилось обработать голосовое, попробуй ещё раз.");
  })
);

bot.on(message("audio"), (ctx) =>
  handleVoiceMessage(ctx, ctx.message.audio.file_id).catch(async (e) => {
    console.error("audio message error:", e.message);
    await ctx.reply("Не получилось обработать аудио, попробуй ещё раз.");
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
    const lines = items.map((r) => `${mskHm(r.dueAt)} — ${r.text}`);
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
    const summary = `сегодня записано ${kcal} ккал за ${todayMeals.length} приём(ов), серия ${streak} дн.`;
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
