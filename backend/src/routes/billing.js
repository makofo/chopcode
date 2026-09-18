import { Router } from "express";
import { prisma } from "../telegramAuth.js";
import { getPlansWithSavings, getPlanById } from "../pricing.js";
import { createPlategaPayment } from "../services/platega.js";

const router = Router();

router.get("/plans", (req, res) => {
  res.json({ plans: getPlansWithSavings() });
});

// Returns whether the current user has active PRO (lifetime or a live subscription).
// The frontend uses this to unlock premium themes and the PRO state.
router.get("/me", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const isPremium =
    !!user &&
    (user.isLifetime || (user.subscriptionUntil && new Date(user.subscriptionUntil) > new Date()));
  res.json({ isPremium });
});

// Creates a real Platega payment and returns the pay URL. The subscription is
// activated later, in the Platega webhook, after a confirmed payment.
router.post("/subscribe", async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = getPlanById(planId);
    if (!plan) return res.status(400).json({ error: "неизвестный тариф" });

    const lifetime = !!plan.isLifetime;
    const botLink = process.env.BOT_LINK || "https://t.me/MeetChop_bot";

    const { transactionId, payUrl } = await createPlategaPayment({
      amount: plan.price,
      description: `ChopBot Premium — ${plan.title}`,
      payload: `${req.user.id}:${plan.id}`,
      returnUrl: botLink,
      failedUrl: botLink,
    });

    await prisma.payment.create({
      data: {
        transactionId,
        userId: req.user.id,
        plan: plan.id,
        months: lifetime ? 0 : plan.months,
        lifetime,
        amount: plan.price,
        status: "PENDING",
      },
    });

    res.json({ ok: true, payUrl });
  } catch (e) {
    console.error("subscribe error:", e.message);
    res.status(500).json({ error: "Не удалось создать платёж, попробуй позже." });
  }
});

// Manual activation, protected by PRO_CODE (owner/testers only).
// This is NOT an open endpoint: without the correct code it returns 403.
router.post("/activate-dev", async (req, res) => {
  const { planId, code } = req.body;
  if (!process.env.PRO_CODE || code !== process.env.PRO_CODE) {
    return res.status(403).json({ error: "нет доступа" });
  }
  const plan = getPlanById(planId);
  if (!plan) return res.status(400).json({ error: "неизвестный тариф" });

  if (plan.isLifetime) {
    await prisma.user.update({ where: { id: req.user.id }, data: { isLifetime: true } });
  } else {
    const until = new Date();
    until.setMonth(until.getMonth() + plan.months);
    await prisma.user.update({ where: { id: req.user.id }, data: { subscriptionUntil: until } });
  }

  res.json({ ok: true });
});

export default router;
