// Распознавание речи в текст через Whisper API.
// Claude API не принимает аудио напрямую, поэтому этот шаг делаем отдельным сервисом.
// Нужен OPENAI_API_KEY в .env. Если появится другой провайдер STT — меняем только этот файл.

export async function transcribeAudio(buffer, filename = "audio.ogg") {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY не задан — распознавание речи не настроено");
  }

  const form = new FormData();
  form.append("file", new Blob([buffer]), filename);
  form.append("model", "whisper-1");
  form.append("language", "ru");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Whisper API error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.text;
}
