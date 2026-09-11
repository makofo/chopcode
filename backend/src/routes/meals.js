import { Router } from "express";
import { prisma } from "../telegramAuth.js";

const router = Router();

// Returns the day string "YYYY-MM-DD" in Moscow time (UTC+3),
// so a "day" is consistent regardless of the server's UTC clock.
function mskDay(date) {
  const t = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return t.toISOString().slice(0, 10);
}

// Streak to DISPLAY: alive if the last logged day is today or yesterday (MSK),
// otherwise the streak is considered broken (0).
function activeStreak(user) {
  const now = new Date();
  const today = mskDay(now);
  const yest = mskDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const last = user?.streakLastDay;
  const alive = last === today || last === yest;
  return {
    count: alive ? (user?.streakCount || 0) : 0,
    loggedToday: last === today,
  };
}

router.get("/", async (req, res) => {
  const { date } = req.query;
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
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ meals, totals, streak: activeStreak(user) });
});

router.post("/", async (req, res) => {
  const { name, calories, protein, fat, carbs } = req.body;
  const meal = await prisma.meal.create({
    data: { userId: req.user.id, name, calories, protein, fat, carbs },
  });

  // Update the streak: one point per day that has at least one logged meal (MSK days).
  const now = new Date();
  const today = mskDay(now);
  const yest = mskDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (user && user.streakLastDay !== today) {
    const count = user.streakLastDay === yest ? (user.streakCount || 0) + 1 : 1;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { streakCount: count, streakLastDay: today },
    });
  }

  res.json(meal);
});

router.delete("/:id", async (req, res) => {
  await prisma.meal.deleteMany({ where: { id: Number(req.params.id), userId: req.user.id } });
  res.json({ ok: true });
});

export default router;
