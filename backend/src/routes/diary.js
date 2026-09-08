import { Router } from "express";
import { prisma } from "../telegramAuth.js";

const router = Router();

router.get("/", async (req, res) => {
  const entries = await prisma.diaryEntry.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(entries);
});

router.post("/", async (req, res) => {
  const { text, mood } = req.body;
  const entry = await prisma.diaryEntry.create({
    data: { userId: req.user.id, text, mood },
  });
  res.json(entry);
});

router.delete("/:id", async (req, res) => {
  await prisma.diaryEntry.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
  res.json({ ok: true });
});

export default router;
