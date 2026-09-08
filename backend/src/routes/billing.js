import { Router } from "express";
import { prisma } from "../telegramAuth.js";
import { getPlansWithSavings, getPlanById } from "../pricing.js";

const router = Router();

router.get("/plans", (req, res) => {
  res.json({ plans: getPlansWithSavings() });
});

// ЗАГЛУШКА оформления оплаты. Реальная оплата рублями в Telegram делается через
// bot.telegram.sendInvoice с provider_token от платёжного провайдера
// (например, ЮKassa/CloudPayments — привязывается через @BotFather → Payments).
// Когда подключим провайдера: здесь будем создавать инвойс и слать его пользователю
// в чат с ботом, а зачисление подписки делать в обработчике successful_payment.
router.post("/subscribe", async (req, res) => {
  const { planId } = req.body;
  const plan = getPlanById(planId);
  if (!plan) return res.status(400).json({ error: "неизвестный тариф" });

  res.json({
    ok: false,
    message:
      "Оплата пока не подключена. Когда добавим платёжного провайдера в Telegram, здесь будет реальный счёт на оплату.",
    plan,
  });
});

// Для ручной активации во время разработки/тестов (потом заменится на вебхук от провайдера оплаты)
router.post("/activate-dev", async (req, res) => {
  const { planId } = req.body;
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
