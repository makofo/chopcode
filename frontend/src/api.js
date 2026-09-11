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
  // Sends an audio file - no JSON Content-Type, the browser sets the multipart header.
  // On error, keeps the response body in err.detail so the UI can show the real reason.
  postAudio: async (path, blob, filename = "voice.webm") => {
    const form = new FormData();
    form.append("audio", blob, filename);
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "X-Telegram-Init-Data": initData() },
      body: form,
    });
    if (!res.ok) {
      let detail = "";
      try {
        detail = await res.text();
      } catch (e) {}
      const err = new Error(`API ${path} -> ${res.status}`);
      err.status = res.status;
      err.detail = detail;
      throw err;
    }
    return res.json();
  },
};
