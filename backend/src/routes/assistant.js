import { Router } from "express";
import multer from "multer";
import { transcribeAudio } from "../services/transcribe.js";
import { classifyText } from "../services/classify.js";
import { saveClassifiedEntry } from "../services/saveEntry.js";
import { checkVoiceAccess } from "../services/voiceQuota.js";
import { getPlansWithSavings } from "../pricing.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});
const router = Router();

router.post("/process-text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text обязателен" });

    const classified = await classifyText(text);
    const result = await saveClassifiedEntry(req.user.id, classified);
    res.json({ recognizedText: text, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/process-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "audio обязателен" });

    // КРИТИЧНО: проверка доступа идёт ДО вызова Whisper/Claude.
    // Если бесплатные попытки исчерпаны и подписки нет — голосовое НЕ уходит
    // в ИИ вообще, деньги на распознавание не тратятся.
    const access = await checkVoiceAccess(req.user.id);
    if (!access.allowed) {
      return res.status(402).json({
        needsUpgrade: true,
        message: "Бесплатные голосовые закончились. Оформи подписку, чтобы продолжить.",
        plans: getPlansWithSavings(),
      });
    }

    const text = await transcribeAudio(req.file.buffer, req.file.originalname);
    const classified = await classifyText(text);
    const result = await saveClassifiedEntry(req.user.id, classified);
    res.json({ recognizedText: text, remainingFree: access.remainingFree, ...result });
  } catch (e) {
    console.error(e);
    if (e.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Голосовое слишком длинное, запиши покороче" });
    }
    res.status(500).json({ error: e.message });
  }
});

router.post("/ask", async (req, res) => {
  const { question } = req.body;
  res.json({
    answer: `Вопросы по записям пока не подключены. Твой вопрос: "${question}".`,
  });
});

export default router;
