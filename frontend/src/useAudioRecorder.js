import { useRef, useState } from "react";

// Records audio via MediaRecorder. Picks a mime type the current browser actually
// supports (desktop Chrome -> webm/opus, iOS/Telegram -> mp4), and returns the blob
// together with its duration and the correct file extension, so the backend
// (Groq Whisper) always receives a file it can decode.

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const cands = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const m of cands) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch (e) {}
  }
  return "";
}

function extFor(mime) {
  if (mime.indexOf("mp4") !== -1) return "mp4";
  if (mime.indexOf("ogg") !== -1) return "ogg";
  return "webm";
}

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeRef = useRef("");
  const startedAtRef = useRef(0);

  const start = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      mimeRef.current = mime;
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      recorder.start();
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setRecording(true);
    } catch (e) {
      setError(e && e.name === "NotAllowedError" ? "no-permission" : "no-mic");
      setRecording(false);
    }
  };

  const stop = () =>
    new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder) return resolve(null);
      recorder.onstop = () => {
        const type = mimeRef.current || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        try {
          recorder.stream.getTracks().forEach((t) => t.stop());
        } catch (e) {}
        setRecording(false);
        resolve({ blob, durationMs: Date.now() - startedAtRef.current, ext: extFor(type) });
      };
      try {
        recorder.stop();
      } catch (e) {
        setRecording(false);
        resolve(null);
      }
    });

  return { recording, start, stop, error };
}
