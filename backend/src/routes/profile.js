import { Router } from "express";
import { prisma } from "../telegramAuth.js";
import { calculateTargets } from "../kbjuCalc.js";

const router = Router();

router.get("/", async (req, res) => {
  const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
  const targets = profile ? calculateTargets(profile) : null;
  res.json({ profile, targets });
});

router.post("/", async (req, res) => {
  const { gender, age, heightCm, weightKg, activity, goal } = req.body;
  const data = {
    gender,
    age: Number(age),
    heightCm: Number(heightCm),
    weightKg: Number(weightKg),
    activity,
    goal,
  };

  const profile = await prisma.profile.upsert({
    where: { userId: req.user.id },
    update: data,
    create: { userId: req.user.id, ...data },
  });

  res.json({ profile, targets: calculateTargets(profile) });
});

export default router;
