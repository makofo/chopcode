import { Router } from "express";
import multer from "multer";
import { transcribeAudio } from "../services/transcribe.js";
import { classifyText } from "../services/classify.js";
import { saveClassifiedEntry } from "../services/saveEntry.js";
import { checkVoiceAccess } from "../services/voiceQuota.js";
import { chatWithChop } from "../services/chatWithChop.js";
import { getPlansWithSavings } from "../pricing.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
});
const router = Router();

// Saves every classified item and returns a combined result.
async function saveAll(userId, items) {
  const results = [];
  for (const it of items) {
    results.push(await saveClassifiedEntry(userId, it));
  }
  return {
    items: results,
    type: results[0]?.type,
    human: results.map((r) => r.human).join("\n"),
  };
}

router.post("/process-text", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "text обязателен" });

    const items = await classifyText(text);
    const saved = await saveAll(req.user.id, items);
    res.json({ recognizedText: text, ...saved });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/process-audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "audio обязателен" });

    // Access check happens BEFORE calling the AI: if the free tries are used up
    // and there is no subscription, the audio never reaches the AI.
    const access = await checkVoiceAccess(req.user.id);
    if (!access.allowed) {
      return res.status(402).json({
        needsUpgrade: true,
        message: "Бесплатные голосовые закончились. Оформи подписку, чтобы продолжить.",
        plans: getPlansWithSavings(),
      });
    }

    const text = await transcribeAudio(req.file.buffer, req.file.originalname);
    const items = await classifyText(text);
    const saved = await saveAll(req.user.id, items);
    res.json({ recognizedText: text, remainingFree: access.remainingFree, ...saved });
  } catch (e) {
    console.error(e);
    if (e.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Голосовое слишком длинное, запиши покороче" });
    }
    res.status(500).json({ error: e.message });
  }
});

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "question обязателен" });
    const answer = await chatWithChop(req.user.id, question);
    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ answer: "Ой, не смог ответить сейчас, попробуй ещё раз чуть позже." });
  }
});

export default router;
