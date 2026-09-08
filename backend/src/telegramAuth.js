import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Проверяет initData, присланный Telegram Mini App SDK (window.Telegram.WebApp.initData)
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
export function verifyTelegramInitData(initData, botToken) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return null;

  const userJson = params.get("user");
  return userJson ? JSON.parse(userJson) : null;
}

// Express middleware: ожидает заголовок X-Telegram-Init-Data
export async function requireTelegramUser(req, res, next) {
  try {
    const initData = req.header("X-Telegram-Init-Data");
    if (!initData) return res.status(401).json({ error: "no init data" });

    const tgUser = verifyTelegramInitData(initData, process.env.BOT_TOKEN);
    if (!tgUser) return res.status(401).json({ error: "invalid init data" });

    const user = await prisma.user.upsert({
      where: { telegramId: String(tgUser.id) },
      update: { firstName: tgUser.first_name, username: tgUser.username },
      create: {
        telegramId: String(tgUser.id),
        firstName: tgUser.first_name,
        username: tgUser.username,
      },
    });

    req.user = user;
    next();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "auth failed" });
  }
}

export { prisma };
