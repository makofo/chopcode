import { Router } from "express";
import { prisma } from "../telegramAuth.js";
import { calculateTargets } from "../kbjuCalc.js";

const router = Router();

// Empty / missing value -> null; otherwise a number.
function toIntOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

router.get("/", async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
  const targets = profile ? calculateTargets(profile) : null;
  res.json({ profile, targets });
});

router.post("/", async (req, res) => {
  const {
    gender,
    age,
    heightCm,
    weightKg,
    activity,
    goal,
    customCalories,
    customProtein,
    customFat,
    customCarbs,
  } = req.body;

  const data = {
    gender: gender || "male",
    age: Number(age) || 0,
    heightCm: Number(heightCm) || 0,
    weightKg: Number(weightKg) || 0,
    activity: activity || "sedentary",
    goal: goal || "maintain",
    customCalories: toIntOrNull(customCalories),
    customProtein: toIntOrNull(customProtein),
    customFat: toIntOrNull(customFat),
    customCarbs: toIntOrNull(customCarbs),
  };

  const profile = await prisma.profile.upsert({
    where: { userId: req.user.id },
    update: data,
    create: { userId: req.user.id, ...data },
  });

  res.json({ profile, targets: calculateTargets(profile) });
});

export default router;
