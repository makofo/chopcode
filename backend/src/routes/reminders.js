import { Router } from "express";
import { prisma } from "../telegramAuth.js";

const router = Router();

router.get("/", async (req, res) => {
  const reminders = await prisma.reminder.findMany({
    where: { userId: req.user.id },
    orderBy: { dueAt: "asc" },
  });
  res.json(reminders);
});

router.post("/", async (req, res) => {
  const { text, dueAt, repeat } = req.body;
  const reminder = await prisma.reminder.create({
    data: { userId: req.user.id, text, dueAt: new Date(dueAt), repeat: repeat ?? "none" },
  });
  res.json(reminder);
});

router.delete("/:id", async (req, res) => {
  await prisma.reminder.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
  res.json({ ok: true });
});

export default router;
