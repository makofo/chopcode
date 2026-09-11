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
    if (!token) return res.status(401).json({ error: "\u043d\u0435\u0442 X-Voice-Token" });

    const user = await prisma.user.findUnique({ where: { voiceToken: token } });
    if (!user) return res.status(401).json({ error: "\u043d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 voice-\u0442\u043e\u043a\u0435\u043d" });

    if (!req.file) return res.status(400).json({ error: "audio \u043e\u0431\u044f\u0437\u0430\u0442\u0435\u043b\u0435\u043d" });

    // Access check BEFORE the AI: if the limit is used up, the AI is not called.
    const access = await checkVoiceAccess(user.id);
    if (!access.allowed) {
      await bot.telegram.sendMessage(
        user.telegramId,
        "\u0411\u0435\u0441\u043f\u043b\u0430\u0442\u043d\u044b\u0435 \u0433\u043e\u043b\u043e\u0441\u043e\u0432\u044b\u0435 \u0437\u0430\u043a\u043e\u043d\u0447\u0438\u043b\u0438\u0441\u044c \ud83d\ude42 \u041e\u0442\u043a\u0440\u043e\u0439 \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u0435 \u2014 \u0442\u0430\u043c \u043c\u043e\u0436\u043d\u043e \u043e\u0444\u043e\u0440\u043c\u0438\u0442\u044c \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0443 \u0431\u0435\u0437 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u0439."
      );
      return res.status(402).json({ needsUpgrade: true });
    }

    const text = await transcribeAudio(req.file.buffer, "voice.m4a");
    const items = await classifyText(text);

    const results = [];
    for (const it of items) {
      results.push(await saveClassifiedEntry(user.id, it));
    }
    const humanAll = results.map((r) => r.human).join("\n");

    await bot.telegram.sendMessage(
      user.telegramId,
      `\ud83c\udf99 \u0420\u0430\u0441\u043f\u043e\u0437\u043d\u0430\u043d\u043e: \u00ab${text}\u00bb\n\n${humanAll}`
    );

    res.json({ ok: true, recognizedText: text, items: results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
