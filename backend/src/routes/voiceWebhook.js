import { Router } from "express";
import multer from "multer";
import { bot } from "../bot.js";
import { prisma } from "../telegramAuth.js";
import { transcribeAudio } from "../services/transcribe.js";
import { classifyText } from "../services/classify.js";
import { saveClassifiedEntry } from "../services/saveEntry.js";
import { checkVoiceAccess } from "../services/voiceQuota.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});
const router = Router();

router.post("/", upload.single("audio"), async (req, res) => {
  try {
    const token = req.header("X-Voice-Token");
    if (!token) return res.status(401).json({ error: "нет X-Voice-Token" });

    const user = await prisma.user.findUnique({ where: { voiceToken: token } });
    if (!user) return res.status(401).json({ error: "неверный voice-токен" });

    if (!req.file) return res.status(400).json({ error: "audio обязателен" });

    // Проверка ДО вызова ИИ — если лимит исчерпан, Whisper/Claude не трогаем.
    const access = await checkVoiceAccess(user.id);
    if (!access.allowed) {
      await bot.telegram.sendMessage(
        user.telegramId,
        "Бесплатные голосовые закончились 🙂 Открой приложение — там можно оформить подписку без ограничений."
      );
      return res.status(402).json({ needsUpgrade: true });
    }

    const text = await transcribeAudio(req.file.buffer, "voice.m4a");
    const classified = await classifyText(text);
    const result = await saveClassifiedEntry(user.id, classified);

    await bot.telegram.sendMessage(
      user.telegramId,
      `🎙 Распознано: «${text}»\n\n${result.human}`
    );

    res.json({ ok: true, recognizedText: text, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
