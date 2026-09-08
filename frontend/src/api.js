const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

function initData() {
  return window.Telegram?.WebApp?.initData || "";
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
  // Для отправки аудиофайла — без Content-Type: JSON, браузер сам проставит multipart-заголовок
  postAudio: async (path, blob, filename = "voice.webm") => {
    const form = new FormData();
    form.append("audio", blob, filename);
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "X-Telegram-Init-Data": initData() },
      body: form,
    });
    if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
    return res.json();
  },
};
