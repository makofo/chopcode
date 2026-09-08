import { Router } from "express";
import { prisma } from "../telegramAuth.js";

const router = Router();

router.get("/", async (req, res) => {
  const { date } = req.query; // "2026-09-08"
  const where = { userId: req.user.id };
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.eatenAt = { gte: start, lt: end };
  }
  const meals = await prisma.meal.findMany({ where, orderBy: { eatenAt: "desc" } });
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      fat: acc.fat + m.fat,
      carbs: acc.carbs + m.carbs,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  );
  res.json({ meals, totals });
});

router.post("/", async (req, res) => {
  const { name, calories, protein, fat, carbs } = req.body;
  const meal = await prisma.meal.create({
    data: { userId: req.user.id, name, calories, protein, fat, carbs },
  });
  res.json(meal);
});

router.delete("/:id", async (req, res) => {
  await prisma.meal.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
  res.json({ ok: true });
});

export default router;
