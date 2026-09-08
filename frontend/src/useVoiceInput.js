import { useRef, useState } from "react";

// Простой хук голосового ввода через Web Speech API.
// Работает в Telegram Desktop / большинстве Android-клиентов на базе Chromium.
// В iOS-версии Telegram (WKWebView) Web Speech API может быть недоступен —
// в таком случае стоит записывать аудио (MediaRecorder) и слать на backend
// для распознавания через внешний сервис (например, Whisper API).
export function useVoiceInput(onResult) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const start = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Голосовой ввод не поддерживается в этом клиенте Telegram");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return { listening, start, stop };
}
