// Speech-to-text via Groq's Whisper endpoint (OpenAI-compatible, free tier).
// Needs GROQ_API_KEY in the environment. If the STT provider ever changes,
// only this file needs to be edited.

export async function transcribeAudio(buffer, filename = "audio.ogg") {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set - speech recognition is not configured");
  }

  const form = new FormData();
  form.append("file", new Blob([buffer]), filename);
  form.append("model", "whisper-large-v3-turbo"); // fast + cheap Whisper model on Groq
  form.append("language", "ru");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq Whisper error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.text;
}
