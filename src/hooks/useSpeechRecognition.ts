import { useState, useCallback, useRef, useEffect } from 'react';
import { compareWords, WordMatchResult } from '../utils/shadowing';

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [matchResult, setMatchResult] = useState<WordMatchResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setIsSupported(true);
    }
  }, []);

  const startCheck = useCallback(
    (targetText: string, stressWords: string[] = []) => {
      const SpeechRecognitionAPI =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) {
        setIsSupported(false);
        return;
      }

      setErrorMessage(null);
      setTranscript('');
      setMatchResult(null);

      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {
            // ignore
          }
        }

        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const text = event.results[0]?.[0]?.transcript || '';
          setTranscript(text);
          const result = compareWords(targetText, text, stressWords);
          setMatchResult(result);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error !== 'no-speech') {
            setErrorMessage(`Speech recognition error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.start();
      } catch (err) {
        console.warn("Failed to start speech recognition:", err);
        setIsListening(false);
        setErrorMessage("Could not start speech recognition.");
      }
    },
    []
  );

  const stopCheck = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const resetResult = useCallback(() => {
    setTranscript('');
    setMatchResult(null);
    setErrorMessage(null);
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    matchResult,
    errorMessage,
    startCheck,
    stopCheck,
    resetResult,
  };
}
