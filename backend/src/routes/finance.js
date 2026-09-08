import { Router } from "express";
import { prisma } from "../telegramAuth.js";

const router = Router();

router.get("/", async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === "income" ? t.amount : -t.amount),
    0
  );
  res.json({ transactions, balance });
});

router.post("/", async (req, res) => {
  const { amount, category, type, note } = req.body;
  const tx = await prisma.transaction.create({
    data: { userId: req.user.id, amount, category, type, note },
  });
  res.json(tx);
});

router.delete("/:id", async (req, res) => {
  await prisma.transaction.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
  res.json({ ok: true });
});

export default router;
