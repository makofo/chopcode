import { Router } from "express";
import { bot } from "../bot.js";
import { prisma } from "../telegramAuth.js";

const router = Router();

// Platega calls this URL on a payment status change. It authenticates with the
// same X-MerchantId / X-Secret headers we use to call Platega. On a CONFIRMED
// payment we activate the user's subscription. Idempotent: re-delivery is safe.
router.post("/", async (req, res) => {
  try {
    if (
      req.header("X-MerchantId") !== process.env.PLATEGA_MERCHANT_ID ||
      req.header("X-Secret") !== process.env.PLATEGA_SECRET
    ) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const { id, status } = req.body || {};
    const payment = id
      ? await prisma.payment.findUnique({ where: { transactionId: id } })
      : null;

    if (payment && status === "CONFIRMED" && payment.status !== "CONFIRMED") {
      if (payment.lifetime) {
        await prisma.user.update({
          where: { id: payment.userId },
          data: { isLifetime: true },
        });
      } else {
        const user = await prisma.user.findUnique({ where: { id: payment.userId } });
        const now = new Date();
        const base =
          user?.subscriptionUntil && new Date(user.subscriptionUntil) > now
            ? new Date(user.subscriptionUntil)
            : now;
        const until = new Date(base.getTime() + payment.months * 30 * 24 * 60 * 60 * 1000);
        await prisma.user.update({
          where: { id: payment.userId },
          data: { subscriptionUntil: until },
        });
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "CONFIRMED" },
      });

      try {
        const u = await prisma.user.findUnique({ where: { id: payment.userId } });
        if (u) {
          await bot.telegram.sendMessage(
            u.telegramId,
            "Оплата прошла ✅ Premium активирован — спасибо! Открой Чопа, все функции уже доступны. 🐈‍⬛❤️"
          );
        }
      } catch (e) {
        console.error("notify pay failed:", e.message);
      }
    } else if (payment && status === "CANCELED" && payment.status === "PENDING") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "CANCELED" },
      });
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("platega webhook error:", e.message);
    // Return 500 so Platega retries; activation is idempotent, so retries are safe.
    res.status(500).json({ error: "processing failed" });
  }
});

export default router;
