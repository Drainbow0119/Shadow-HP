/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Sentence, SentenceProgress, ScreenType } from './types';
import { INITIAL_SENTENCES } from './data/constants';
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { StartScreen } from './screens/StartScreen';
import { SentenceListScreen } from './screens/SentenceListScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { EditSentencesScreen } from './screens/EditSentencesScreen';
import { FinishScreen } from './screens/FinishScreen';
import { VideoPlayerCard } from './components/VideoPlayerCard';
import { formatTime } from './utils/shadowing';

const STORAGE_SENTENCES_KEY = 'scene_shadow_sentences_v1';
const STORAGE_PROGRESS_KEY = 'scene_shadow_progress_v1';

export default function App() {
  const containerId = 'youtube-player-host';

  // Sentences state with localStorage backup
  const [sentences, setSentences] = useState<Sentence[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SENTENCES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read sentences from localStorage, using defaults:", e);
    }
    return INITIAL_SENTENCES;
  });

  // Progress state with localStorage backup
  const [progressMap, setProgressMap] = useState<Record<number, SentenceProgress>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROGRESS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not read progress from localStorage:", e);
    }
    return {};
  });

  // Current screen
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    // Autostart support for automated checks and direct entry
    if (typeof window !== 'undefined' && window.location.search.includes('autostart=1')) {
      return 'practice';
    }
    return 'start';
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // YouTube player hook
  const player = useYouTubePlayer(containerId);

  // Save sentences to localStorage
  const handleUpdateSentences = (newSentences: Sentence[]) => {
    setSentences(newSentences);
    try {
      localStorage.setItem(STORAGE_SENTENCES_KEY, JSON.stringify(newSentences));
    } catch (e) {
      console.warn("Could not save sentences to localStorage:", e);
    }
  };

  // Update progress for a sentence
  const handleUpdateProgress = useCallback(
    (id: number, updater: (prev: SentenceProgress) => SentenceProgress) => {
      setProgressMap((prev) => {
        const current = prev[id] || {
          id,
          plays: 0,
          recordings: 0,
          selfCheck: [null, null, null],
          status: 'new',
        };
        const next = updater(current);
        const updatedMap = {
          ...prev,
          [id]: next,
        };
        try {
          localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(updatedMap));
        } catch (e) {
          console.warn("Could not save progress to localStorage:", e);
        }
        return updatedMap;
      });
    },
    []
  );

  // Stop video playback when navigating between screens
  const navigateTo = (screen: ScreenType) => {
    player.pause();
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSentence = (idx: number) => {
    setCurrentIndex(idx);
    navigateTo('practice');
  };

  const currentSentence = sentences[currentIndex] || sentences[0] || {
    id: 1,
    speaker: "Speaker",
    text: "Sample",
    korean: "예시",
    stress: [],
    start: 0,
    end: 3,
  };

  return (
    <div className="min-h-screen bg-[#0e041c] flex justify-center text-purple-100 font-sans selection:bg-amber-500 selection:text-purple-950">
      <main className="w-full max-w-[480px] bg-[#150727] min-h-screen shadow-2xl relative flex flex-col">
        {/* Persistent Video Player - always kept in DOM so iframe and player API are never destroyed */}
        <div className={currentScreen === 'start' || currentScreen === 'finish' ? 'hidden' : 'block'}>
          <VideoPlayerCard
            containerId={containerId}
            embedFailed={player.embedFailed}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            currentSentenceTime={
              currentScreen === 'practice' && currentSentence
                ? `${formatTime(currentSentence.start)} – ${formatTime(currentSentence.end)}`
                : undefined
            }
            onPlayAudioFallback={() => player.speakFallback(currentSentence.text)}
            onRetryEmbed={player.retryInit}
          />
        </div>

        {currentScreen === 'start' && (
          <StartScreen
            onStartPractice={() => {
              setCurrentIndex(0);
              navigateTo('practice');
            }}
            onGoToList={() => navigateTo('list')}
            onGoToEdit={() => navigateTo('edit')}
            sentenceCount={sentences.length}
          />
        )}

        {currentScreen === 'list' && (
          <SentenceListScreen
            sentences={sentences}
            progressMap={progressMap}
            onSelectSentence={handleSelectSentence}
            onBackToStart={() => navigateTo('start')}
            onGoToEdit={() => navigateTo('edit')}
          />
        )}

        {currentScreen === 'practice' && sentences.length > 0 && (
          <PracticeScreen
            sentence={currentSentence}
            index={currentIndex}
            totalSentences={sentences.length}
            player={player}
            progress={progressMap[currentSentence.id]}
            onUpdateProgress={handleUpdateProgress}
            onPrev={() => {
              if (currentIndex > 0) {
                player.pause();
                setCurrentIndex(currentIndex - 1);
              }
            }}
            onNext={() => {
              if (currentIndex < sentences.length - 1) {
                player.pause();
                setCurrentIndex(currentIndex + 1);
              }
            }}
            onGoToList={() => navigateTo('list')}
            onFinishSession={() => navigateTo('finish')}
          />
        )}

        {currentScreen === 'edit' && (
          <EditSentencesScreen
            sentences={sentences}
            player={player}
            onUpdateSentences={handleUpdateSentences}
            onBack={() => navigateTo('list')}
          />
        )}

        {currentScreen === 'finish' && (
          <FinishScreen
            sentences={sentences}
            progressMap={progressMap}
            onPracticeSentence={(idx) => {
              setCurrentIndex(idx);
              navigateTo('practice');
            }}
            onPracticeAgainFromStart={() => {
              setCurrentIndex(0);
              navigateTo('practice');
            }}
            onGoToList={() => navigateTo('list')}
          />
        )}
      </main>
    </div>
  );
}
