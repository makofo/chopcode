import { prisma } from "../telegramAuth.js";
import { FREE_VOICE_LIMIT } from "../pricing.js";

// Проверяет, можно ли пользователю обработать голосовое, и если да — списывает
// одну бесплатную попытку (если подписки нет). Критично: эта проверка идёт
// ДО вызова Whisper/Claude — если лимит исчерпан, ИИ вообще не вызывается,
// деньги не тратятся.
export async function checkVoiceAccess(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const hasActiveSubscription =
    user.isLifetime || (user.subscriptionUntil && user.subscriptionUntil > new Date());

  if (hasActiveSubscription) {
    return { allowed: true, reason: "subscription" };
  }

  if (user.freeVoiceUsed < FREE_VOICE_LIMIT) {
    await prisma.user.update({
      where: { id: userId },
      data: { freeVoiceUsed: { increment: 1 } },
    });
    return {
      allowed: true,
      reason: "free_trial",
      remainingFree: FREE_VOICE_LIMIT - user.freeVoiceUsed - 1,
    };
  }

  return { allowed: false, reason: "needs_subscription" };
}
