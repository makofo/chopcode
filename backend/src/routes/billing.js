import { Router } from "express";
import { prisma } from "../telegramAuth.js";
import { getPlansWithSavings, getPlanById } from "../pricing.js";

const router = Router();

router.get("/plans", (req, res) => {
  res.json({ plans: getPlansWithSavings() });
});

// STUB for checkout. Real ruble payment will go through the payment provider
// (Platega): create a payment, return the pay URL, and activate the subscription
// in the provider webhook after a successful payment.
router.post("/subscribe", async (req, res) => {
  const { planId } = req.body;
  const plan = getPlanById(planId);
  if (!plan) return res.status(400).json({ error: "\u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u044b\u0439 \u0442\u0430\u0440\u0438\u0444" });

  res.json({
    ok: false,
    message:
      "\u041e\u043f\u043b\u0430\u0442\u0430 \u043f\u043e\u043a\u0430 \u043d\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0430. \u041a\u043e\u0433\u0434\u0430 \u0434\u043e\u0431\u0430\u0432\u0438\u043c \u043f\u043b\u0430\u0442\u0451\u0436\u043d\u043e\u0433\u043e \u043f\u0440\u043e\u0432\u0430\u0439\u0434\u0435\u0440\u0430, \u0437\u0434\u0435\u0441\u044c \u0431\u0443\u0434\u0435\u0442 \u0440\u0435\u0430\u043b\u044c\u043d\u044b\u0439 \u0441\u0447\u0451\u0442 \u043d\u0430 \u043e\u043f\u043b\u0430\u0442\u0443.",
    plan,
  });
});

// Manual activation, protected by PRO_CODE (owner/testers only).
// This is NOT an open endpoint: without the correct code it returns 403.
// Real customers get PRO automatically via the payment webhook (added later).
router.post("/activate-dev", async (req, res) => {
  const { planId, code } = req.body;
  if (!process.env.PRO_CODE || code !== process.env.PRO_CODE) {
    return res.status(403).json({ error: "\u043d\u0435\u0442 \u0434\u043e\u0441\u0442\u0443\u043f\u0430" });
  }
  const plan = getPlanById(planId);
  if (!plan) return res.status(400).json({ error: "\u043d\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043d\u044b\u0439 \u0442\u0430\u0440\u0438\u0444" });

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
