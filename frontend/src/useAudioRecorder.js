import { useRef, useState } from "react";

// Записывает аудио через MediaRecorder (работает шире, чем Web Speech API,
// и позволяет отправить сырой звук на backend для Whisper + классификации).
export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  const stop = () =>
    new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) return resolve(null);

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        recorder.stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });

  return { recording, start, stop };
}
