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

// Rate limit for expensive AI endpoints (Whisper + Claude cost money per call):
// max 10 voice requests per minute per IP.
const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "\u0421\u043b\u0438\u0448\u043a\u043e\u043c \u043c\u043d\u043e\u0433\u043e \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u044b\u0445 \u0437\u0430\u043f\u0440\u043e\u0441\u043e\u0432, \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0447\u0435\u0440\u0435\u0437 \u043c\u0438\u043d\u0443\u0442\u0443" },
});
app.use("/api/assistant/process-audio", voiceLimiter);
app.use("/voice-webhook", voiceLimiter);

// Public endpoint (per-user token, not Telegram initData) for iOS Shortcuts / Back Tap
app.use("/voice-webhook", voiceWebhookRouter);

// Everything else requires valid Telegram initData from the Mini App
app.use("/api/reminders", requireTelegramUser, remindersRouter);
app.use("/api/finance", requireTelegramUser, financeRouter);
app.use("/api/meals", requireTelegramUser, mealsRouter);
app.use("/api/diary", requireTelegramUser, diaryRouter);
app.use("/api/assistant", requireTelegramUser, assistantRouter);
app.use("/api/profile", requireTelegramUser, profileRouter);
app.use("/api/billing", requireTelegramUser, billingRouter);

// --- Telegram bot: webhook mode instead of long-polling ---
const WEBHOOK_PATH = `/telegraf/${process.env.BOT_TOKEN}`;
app.use(bot.webhookCallback(WEBHOOK_PATH));

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`API running on port ${PORT}`);

  if (process.env.PUBLIC_URL) {
    await bot.telegram.setWebhook(`${process.env.PUBLIC_URL}${WEBHOOK_PATH}`);
    console.log("Bot webhook set:", `${process.env.PUBLIC_URL}${WEBHOOK_PATH}`);
  } else {
    console.warn("PUBLIC_URL not set - webhook not configured, bot will not receive messages");
  }

  // Persistent menu button next to the chat input: opens the Mini App ("Open Chop").
  // Set globally for all chats, so users never need to type /start again.
  if (process.env.WEBAPP_URL) {
    try {
      await bot.telegram.callApi("setChatMenuButton", {
        menu_button: {
          type: "web_app",
          text: "\u041e\u0442\u043a\u0440\u044b\u0442\u044c \u0427\u043e\u043f\u0430",
          web_app: { url: process.env.WEBAPP_URL },
        },
      });
      console.log("Chat menu button set");
    } catch (e) {
      console.error("Failed to set menu button:", e.message);
    }
  }
});

startReminderCron();
