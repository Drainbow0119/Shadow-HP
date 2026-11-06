import { useEffect, useRef, useState, useCallback } from 'react';
import { MOVIE_INFO } from '../data/constants';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface PlayerControls {
  playSegment: (start: number, end: number, loop: boolean, onEnded?: () => void, fallbackText?: string) => void;
  pause: () => void;
  play: () => void;
  seekTo: (seconds: number) => void;
  setSpeed: (rate: number) => void;
  getCurrentTime: () => number;
  speakFallback: (text: string, onEnd?: () => void) => void;
  stopSpeech: () => void;
  retryInit: () => void;
  isReady: boolean;
  isPlaying: boolean;
  playbackRate: number;
  embedFailed: boolean;
  isFallbackAudio: boolean;
  currentTime: number;
}

export function useYouTubePlayer(containerId: string) {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRateState] = useState(1.0);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [isFallbackAudio, setIsFallbackAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const segmentConfigRef = useRef<{
    start: number;
    end: number;
    loop: boolean;
    onEnded?: () => void;
    fallbackText?: string;
    isLoopingPause?: boolean;
  } | null>(null);

  const pollIntervalRef = useRef<number | null>(null);
  const loopTimeoutRef = useRef<number | null>(null);
  const fallbackTimeoutRef = useRef<number | null>(null);

  // Stop any active speech synthesis
  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Native speech fallback with British English preference
  const speakFallback = useCallback(
    (text: string, onEnd?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        return;
      }

      stopSpeech();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = playbackRate;
      utterance.lang = 'en-GB';

      // Pick a British or English voice if available
      const voices = window.speechSynthesis.getVoices();
      const britishVoice = voices.find(
        (v) => v.lang.includes('en-GB') || v.name.includes('British') || v.name.includes('UK')
      ) || voices.find((v) => v.lang.startsWith('en'));

      if (britishVoice) {
        utterance.voice = britishVoice;
      }

      utterance.onstart = () => {
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    },
    [playbackRate, stopSpeech]
  );

  // Initialize YouTube Iframe API
  const initPlayer = useCallback(() => {
    if (typeof window === 'undefined') return;

    const container = document.getElementById(containerId);
    if (!container) return;

    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        // ignore
      }
      playerRef.current = null;
    }

    try {
      playerRef.current = new window.YT.Player(containerId, {
        videoId: MOVIE_INFO.videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          start: MOVIE_INFO.start,
          end: MOVIE_INFO.end,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1,
          cc_load_policy: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            setIsReady(true);
            setEmbedFailed(false);
          },
          onStateChange: (event: any) => {
            const state = event.data;
            // 1 = PLAYING
            if (state === 1) {
              setIsPlaying(true);
            } else {
              setIsPlaying(false);
            }
          },
          onError: (error: any) => {
            console.warn("YouTube player onError event:", error.data);
            // Error 101, 150, 153, 2, 5, etc.
            setEmbedFailed(true);
            setIsFallbackAudio(true);
          },
        },
      });
    } catch (err) {
      console.warn("Failed to initialize YT Player:", err);
      setEmbedFailed(true);
      setIsFallbackAudio(true);
    }
  }, [containerId]);

  useEffect(() => {
    let checkTimer: number;

    function ensureApiAndInit() {
      if (!window.YT) {
        const existingScript = document.getElementById('youtube-iframe-api');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.id = 'youtube-iframe-api';
          tag.src = 'https://www.youtube.com/iframe_api';
          const firstScriptTag = document.getElementsByTagName('script')[0];
          firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
        }

        const prevCallback = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prevCallback) prevCallback();
          initPlayer();
        };
      } else if (window.YT.Player) {
        initPlayer();
      }
    }

    // Attempt init once container is rendered
    checkTimer = window.setTimeout(ensureApiAndInit, 100);

    return () => {
      clearTimeout(checkTimer);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
      stopSpeech();
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [initPlayer, stopSpeech]);

  // Polling loop for segment monitoring
  useEffect(() => {
    pollIntervalRef.current = window.setInterval(() => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') {
        return;
      }
      try {
        const time = playerRef.current.getCurrentTime() || 0;
        setCurrentTime(time);

        const config = segmentConfigRef.current;
        if (config && !config.isLoopingPause) {
          if (time >= config.end) {
            // Reached segment end
            playerRef.current.pauseVideo();
            setIsPlaying(false);

            if (config.onEnded) {
              const cb = config.onEnded;
              config.onEnded = undefined;
              cb();
            }

            if (config.loop) {
              config.isLoopingPause = true;
              loopTimeoutRef.current = window.setTimeout(() => {
                if (segmentConfigRef.current?.loop) {
                  segmentConfigRef.current.isLoopingPause = false;
                  playerRef.current.seekTo(config.start, true);
                  playerRef.current.playVideo();
                }
              }, 1500); // 1.5 seconds pause for learner to repeat
            }
          }
        }
      } catch (e) {
        // player might be unready or destroyed
      }
    }, 100);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const playSegment = useCallback(
    (start: number, end: number, loop: boolean, onEnded?: () => void, fallbackText?: string) => {
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);

      segmentConfigRef.current = {
        start,
        end,
        loop,
        onEnded,
        fallbackText,
        isLoopingPause: false,
      };

      // If YouTube embed failed or is not ready, use voice fallback audio
      if (embedFailed || !playerRef.current || typeof playerRef.current.playVideo !== 'function') {
        if (fallbackText) {
          speakFallback(fallbackText, () => {
            if (onEnded) onEnded();
            if (loop && segmentConfigRef.current?.loop) {
              fallbackTimeoutRef.current = window.setTimeout(() => {
                if (segmentConfigRef.current?.loop) {
                  playSegment(start, end, loop, onEnded, fallbackText);
                }
              }, 1500);
            }
          });
        } else {
          // Simulate duration
          setIsPlaying(true);
          const durationMs = ((end - start) / playbackRate) * 1000;
          fallbackTimeoutRef.current = window.setTimeout(() => {
            setIsPlaying(false);
            if (onEnded) onEnded();
          }, durationMs);
        }
        return;
      }

      try {
        playerRef.current.seekTo(start, true);
        playerRef.current.playVideo();
      } catch (err) {
        console.warn("Could not play YouTube segment, falling back to speech:", err);
        if (fallbackText) {
          speakFallback(fallbackText, onEnded);
        }
      }
    },
    [embedFailed, playbackRate, speakFallback]
  );

  const pause = useCallback(() => {
    if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
    if (segmentConfigRef.current) {
      segmentConfigRef.current.loop = false;
    }
    stopSpeech();

    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      try {
        playerRef.current.pauseVideo();
      } catch (err) {
        // ignore
      }
    }
    setIsPlaying(false);
  }, [stopSpeech]);

  const play = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        playerRef.current.playVideo();
      } catch (err) {
        // ignore
      }
    }
  }, []);

  const seekTo = useCallback((seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try {
        playerRef.current.seekTo(seconds, true);
        setCurrentTime(seconds);
      } catch (err) {
        // ignore
      }
    }
  }, []);

  const setSpeed = useCallback((rate: number) => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      try {
        playerRef.current.setPlaybackRate(rate);
      } catch (err) {
        // ignore
      }
    }
    setPlaybackRateState(rate);
  }, []);

  const getCurrentTime = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      try {
        return playerRef.current.getCurrentTime() || 0;
      } catch (err) {
        return currentTime;
      }
    }
    return currentTime;
  }, [currentTime]);

  return {
    playSegment,
    pause,
    play,
    seekTo,
    setSpeed,
    getCurrentTime,
    speakFallback,
    stopSpeech,
    retryInit: initPlayer,
    isReady,
    isPlaying,
    playbackRate,
    embedFailed,
    isFallbackAudio,
    currentTime,
  };
}
