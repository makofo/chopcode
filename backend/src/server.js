import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { requireTelegramUser } from "./telegramAuth.js";
import { bot, startReminderCron } from "./bot.js";

import remindersRouter from "./routes/reminders.js";
import financeRouter from "./routes/finance.js";
import mealsRouter from "./routes/meals.js";
import diaryRouter from "./routes/diary.js";
import assistantRouter from "./routes/assistant.js";
import voiceWebhookRouter from "./routes/voiceWebhook.js";
import profileRouter from "./routes/profile.js";
import billingRouter from "./routes/billing.js";

const app = express();
app.use(cors());
app.use(express.json());

// Rate limit на дорогие ИИ-эндпоинты (Whisper + Claude стоят денег за каждый вызов) —
// не более 10 голосовых запросов в минуту с одного IP. Дополнительно стоит
// ограничивать и по userId/telegramId, если это станет проблемой на практике.
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Слишком много голосовых запросов, попробуй через минуту" },
});
app.use("/api/assistant/process-audio", voiceLimiter);
app.use("/voice-webhook", voiceLimiter);

// Публичный эндпоинт (свой токен на пользователя, не Telegram initData) — для iOS Shortcuts / Back Tap
app.use("/voice-webhook", voiceWebhookRouter);

// Всё остальное API требует валидного Telegram initData из Mini App
app.use("/api/reminders", requireTelegramUser, remindersRouter);
app.use("/api/finance", requireTelegramUser, financeRouter);
app.use("/api/meals", requireTelegramUser, mealsRouter);
app.use("/api/diary", requireTelegramUser, diaryRouter);
app.use("/api/assistant", requireTelegramUser, assistantRouter);
app.use("/api/profile", requireTelegramUser, profileRouter);
app.use("/api/billing", requireTelegramUser, billingRouter);

// --- Telegram bot: webhook-режим вместо long-polling ---
// Long-polling (bot.launch()) держит одно соединение и работает только на одном
// инстансе backend. При масштабировании (несколько копий сервера, автоскейлинг)
// нужен webhook: Telegram сам стучится на наш HTTPS-урл.
const WEBHOOK_PATH = `/telegraf/${process.env.BOT_TOKEN}`;
app.use(bot.webhookCallback(WEBHOOK_PATH));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`API запущен на порту ${PORT}`);

  if (process.env.PUBLIC_URL) {
    await bot.telegram.setWebhook(`${process.env.PUBLIC_URL}${WEBHOOK_PATH}`);
    console.log("Webhook бота установлен:", `${process.env.PUBLIC_URL}${WEBHOOK_PATH}`);
  } else {
    console.warn(
      "PUBLIC_URL не задан в .env — webhook бота не установлен, бот не будет получать сообщения"
    );
  }
});

startReminderCron();
