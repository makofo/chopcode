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
    if (!text) return res.status(400).json({ error: "text \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d" });

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
    if (!req.file) return res.status(400).json({ error: "audio \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d" });

    // Access check happens BEFORE calling the AI: if the free tries are used up
    // and there is no subscription, the audio never reaches the AI.
    const access = await checkVoiceAccess(req.user.id);
    if (!access.allowed) {
      return res.status(402).json({
        needsUpgrade: true,
        message: "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0435 \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u044b\u0435 \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c. \u041e\u0444\u043e\u0440\u043c\u0438 \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0443, \u0447\u0442\u043e\u0431\u044b \u043f\u0440\u043e\u0434\u043e\u043b\u0436\u0438\u0442\u044c.",
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
      return res.status(413).json({ error: "\u0413\u043e\u043b\u043e\u0441\u043e\u0432\u043e\u0435 \u0441\u043b\u0438\u0448\u043a\u043e\u043c \u0434\u043b\u0438\u043d\u043d\u043e\u0435, \u0437\u0430\u043f\u0438\u0448\u0438 \u043f\u043e\u043a\u043e\u0440\u043e\u0447\u0435" });
    }
    res.status(500).json({ error: e.message });
  }
});

router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "question \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d" });
    const answer = await chatWithChop(req.user.id, question);
    res.json({ answer });
  } catch (e) {
    console.error(e);
    res.status(500).json({ answer: "\u041e\u0439, \u043d\u0435 \u0441\u043c\u043e\u0433 \u043e\u0442\u0432\u0435\u0442\u0438\u0442\u044c \u0441\u0435\u0439\u0447\u0430\u0441, \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439 \u0435\u0449\u0451 \u0440\u0430\u0437 \u0447\u0443\u0442\u044c \u043f\u043e\u0437\u0436\u0435." });
  }
});

export default router;
