import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(
    async (maxDurationMs?: number, onAutoStop?: () => void): Promise<boolean> => {
      try {
        setPermissionDenied(false);

        // Clear previous audio
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
          setAudioUrl(null);
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);
          setIsRecording(false);

          // Stop all stream audio tracks to turn off microphone light
          stream.getTracks().forEach((track) => track.stop());

          if (onAutoStop) onAutoStop();
        };

        mediaRecorder.start();
        setIsRecording(true);

        // Schedule auto-stop if max duration provided
        if (maxDurationMs && maxDurationMs > 0) {
          if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
          stopTimeoutRef.current = window.setTimeout(() => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
              mediaRecorderRef.current.stop();
            }
          }, maxDurationMs);
        }

        return true;
      } catch (err: any) {
        console.warn("Microphone access error:", err);
        setPermissionDenied(true);
        setIsRecording(false);
        return false;
      }
    },
    [audioUrl]
  );

  const stopRecording = useCallback(() => {
    if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn("Error stopping recorder:", err);
      }
    }
  }, []);

  const playMyVoice = useCallback(() => {
    if (!audioUrl) return;

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    audioElementRef.current = audio;

    setIsPlayingVoice(true);
    audio.onended = () => setIsPlayingVoice(false);
    audio.onerror = () => setIsPlayingVoice(false);
    audio.play().catch((err) => {
      console.warn("Failed to play user recording:", err);
      setIsPlayingVoice(false);
    });
  }, [audioUrl]);

  const stopMyVoice = useCallback(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlayingVoice(false);
    }
  }, []);

  return {
    isRecording,
    audioUrl,
    isPlayingVoice,
    permissionDenied,
    hasPermission,
    startRecording,
    stopRecording,
    playMyVoice,
    stopMyVoice,
    clearAudio: () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    },
  };
}
