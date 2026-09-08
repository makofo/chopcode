// Классификация свободного текста (из голоса) в структурированную запись
// для одной из вкладок: reminder | transaction | meal | diary.
// Используем Claude API (модель claude-sonnet-4-6) со строгим требованием вернуть только JSON.

const SYSTEM_PROMPT = `Ты — модуль классификации для приложения-органайзера.
Пользователь наговорил голосовое сообщение, оно уже расшифровано в текст (на русском).
Определи, к какой из категорий это относится, и извлеки структурированные данные.

Категории и формат ответа (ответь ТОЛЬКО валидным JSON, без markdown и пояснений):

1. Напоминание — если пользователь просит напомнить о чём-то в конкретное время/дату.
{"type":"reminder","data":{"text":"...","dueAt":"2026-09-09T18:00:00","repeat":"none"}}
repeat: "none" | "daily" | "weekly"
Если время не указано явно — поставь разумное время (например, через 1 час от текущего момента).
Текущее время: {{NOW}}

2. Финансовая операция — если упомянута трата или доход с суммой.
{"type":"transaction","data":{"amount":500,"category":"еда","type":"expense","note":"..."}}
type: "expense" | "income"

3. Приём пищи — если пользователь говорит, что съел/выпил что-то (даже без точных ккал — оцени примерно по типичным значениям для этого блюда/продукта).
{"type":"meal","data":{"name":"...","calories":350,"protein":20,"fat":10,"carbs":40}}

4. Запись в дневник — если это просто мысль, размышление, описание дня/настроения без явного указания на напоминание, трату или еду.
{"type":"diary","data":{"text":"...","mood":"..."}}
mood — необязательно, укажи только если настроение явно прослеживается, иначе null.

Если не уверен между категориями — выбирай diary как самый безопасный вариант.
Отвечай строго JSON-объектом верхнего уровня, без дополнительного текста.`;

export async function classifyText(text) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY не задан — ИИ-классификация не настроена");
  }

  const now = new Date().toISOString();
  const systemPrompt = SYSTEM_PROMPT.replace("{{NOW}}", now);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001", // самая дешёвая модель — для классификации/извлечения полей достаточно
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: text }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  const raw = data.content.find((c) => c.type === "text")?.text ?? "{}";
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    // Если модель вернула что-то невалидное — безопасный fallback в дневник
    return { type: "diary", data: { text, mood: null } };
  }
}
