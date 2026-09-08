import { prisma } from "../telegramAuth.js";

// Сохраняет структурированную запись (результат classifyText) в нужную таблицу.
// Возвращает { type, saved, human } — human — короткое описание для ответа пользователю.
export async function saveClassifiedEntry(userId, classified) {
  const { type, data } = classified;

  switch (type) {
    case "reminder": {
      const saved = await prisma.reminder.create({
        data: {
          userId,
          text: data.text,
          dueAt: new Date(data.dueAt),
          repeat: data.repeat || "none",
        },
      });
      return {
        type,
        saved,
        human: `⏰ Напоминание добавлено: «${data.text}» на ${new Date(data.dueAt).toLocaleString("ru-RU")}`,
      };
    }

    case "transaction": {
      const saved = await prisma.transaction.create({
        data: {
          userId,
          amount: Number(data.amount) || 0,
          category: data.category || "прочее",
          type: data.type === "income" ? "income" : "expense",
          note: data.note || null,
        },
      });
      return {
        type,
        saved,
        human: `💰 ${data.type === "income" ? "Доход" : "Расход"} записан: ${data.amount} ₽ (${data.category})`,
      };
    }

    case "meal": {
      const saved = await prisma.meal.create({
        data: {
          userId,
          name: data.name,
          calories: Number(data.calories) || 0,
          protein: Number(data.protein) || 0,
          fat: Number(data.fat) || 0,
          carbs: Number(data.carbs) || 0,
        },
      });
      return {
        type,
        saved,
        human: `🍎 Приём пищи добавлен: ${data.name} (~${data.calories} ккал)`,
      };
    }

    case "diary":
    default: {
      const saved = await prisma.diaryEntry.create({
        data: { userId, text: data.text, mood: data.mood || null },
      });
      return { type: "diary", saved, human: `📔 Записано в дневник: «${data.text}»` };
    }
  }
}
