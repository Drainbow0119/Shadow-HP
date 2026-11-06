import React, { useState, useEffect, useRef } from 'react';
import { Sentence, SentenceProgress, StepNumber, SelfCheckScore } from '../types';
import { STEP_INSTRUCTIONS } from '../data/constants';
import { PlayerControls } from '../hooks/useYouTubePlayer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { formatTime, normalizeWord } from '../utils/shadowing';
import {
  Play,
  Pause,
  Repeat,
  Volume2,
  Mic,
  Square,
  ChevronLeft,
  ChevronRight,
  List,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface PracticeScreenProps {
  sentence: Sentence;
  index: number;
  totalSentences: number;
  player: PlayerControls;
  progress?: SentenceProgress;
  onUpdateProgress: (id: number, updater: (prev: SentenceProgress) => SentenceProgress) => void;
  onPrev: () => void;
  onNext: () => void;
  onGoToList: () => void;
  onFinishSession: () => void;
}

export const PracticeScreen: React.FC<PracticeScreenProps> = ({
  sentence,
  index,
  totalSentences,
  player,
  progress,
  onUpdateProgress,
  onPrev,
  onNext,
  onGoToList,
  onFinishSession,
}) => {
  // Step state (1 to 4)
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [isTextHidden, setIsTextHidden] = useState<boolean>(true);
  const [isKoreanHidden, setIsKoreanHidden] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(false);

  // Audio recorder
  const {
    isRecording,
    audioUrl,
    isPlayingVoice,
    permissionDenied,
    startRecording,
    stopRecording,
    playMyVoice,
    stopMyVoice,
    clearAudio,
  } = useAudioRecorder();

  // Speech Recognition (Word Check)
  const {
    isSupported: isSpeechSupported,
    isListening: isCheckingWords,
    transcript,
    matchResult,
    errorMessage: speechError,
    startCheck,
    stopCheck,
    resetResult: resetWordCheck,
  } = useSpeechRecognition();

  // Reset audio & word check when sentence changes
  useEffect(() => {
    clearAudio();
    resetWordCheck();
    // Default text visibility follows current step
    setIsTextHidden(STEP_INSTRUCTIONS[currentStep].defaultHideText);
  }, [sentence.id, clearAudio, resetWordCheck]);

  // Handle step selection
  const handleSelectStep = (step: StepNumber) => {
    setCurrentStep(step);
    setIsTextHidden(STEP_INSTRUCTIONS[step].defaultHideText);
  };

  // Play segment
  const handlePlay = () => {
    player.playSegment(sentence.start, sentence.end, isLooping, undefined, sentence.text);
    onUpdateProgress(sentence.id, (prev) => ({
      ...prev,
      plays: prev.plays + 1,
    }));
  };

  // Toggle loop
  const handleToggleLoop = () => {
    const nextLoop = !isLooping;
    setIsLooping(nextLoop);
    if (player.isPlaying) {
      player.playSegment(sentence.start, sentence.end, nextLoop, undefined, sentence.text);
    }
  };

  // Speed changer
  const handleSpeedChange = (speed: number) => {
    player.setSpeed(speed);
  };

  // Record user voice while playing sentence
  const handleToggleRecord = async () => {
    if (isRecording) {
      stopRecording();
      player.pause();
      return;
    }

    // Sentence duration adjusted for playback rate + 1.0 second buffer after end
    const durationSec = (sentence.end - sentence.start) / player.playbackRate;
    const totalRecordMs = Math.round((durationSec + 1.0) * 1000);

    const started = await startRecording(totalRecordMs, () => {
      // Auto-stopped
      onUpdateProgress(sentence.id, (prev) => ({
        ...prev,
        recordings: prev.recordings + 1,
        status: currentStep === 4 ? 'done' : 'practiced',
      }));
    });

    if (started) {
      // Loop is ignored while recording
      player.playSegment(sentence.start, sentence.end, false, undefined, sentence.text);
    }
  };

  // Self check rating handler
  const handleSelfCheck = (questionIndex: 0 | 1 | 2, score: SelfCheckScore) => {
    onUpdateProgress(sentence.id, (prev) => {
      const nextScores: [SelfCheckScore, SelfCheckScore, SelfCheckScore] = [
        ...prev.selfCheck,
      ];
      nextScores[questionIndex] = score;
      return {
        ...prev,
        selfCheck: nextScores,
      };
    });
  };

  // Check my words handler
  const handleCheckWords = () => {
    if (isCheckingWords) {
      stopCheck();
    } else {
      startCheck(sentence.text, sentence.stress);
    }
  };

  // Helper to render sentence text with bold stress words
  const renderSentenceWithStress = () => {
    const words = sentence.text.split(/(\s+)/);
    const normalizedStress = (sentence.stress || []).map((s) => normalizeWord(s));

    return words.map((chunk, idx) => {
      const norm = normalizeWord(chunk);
      const isStress = normalizedStress.includes(norm);

      if (isStress) {
        return (
          <strong
            key={idx}
            className="font-extrabold text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] underline decoration-amber-400/60 decoration-2 underline-offset-4"
          >
            {chunk}
          </strong>
        );
      }
      return <span key={idx}>{chunk}</span>;
    });
  };

  const selfCheckQuestions = [
    { labelEn: "Did I keep up with the speed?", labelKo: "속도를 잘 맞추었나요?" },
    { labelEn: "Did I stress the bold words?", labelKo: "강조 단어에 힘을 주었나요?" },
    { labelEn: "Did my voice go up and down like the actor?", labelKo: "억양을 배우처럼 살렸나요?" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#150727] text-purple-100 pb-16">
      {/* 2. Top Nav & Sentence Counter */}
      <div className="px-4 py-2.5 bg-[#1e0b37] border-b border-purple-800/60 flex items-center justify-between">
        <button
          onClick={onGoToList}
          className="flex items-center gap-1 text-xs text-purple-300 hover:text-amber-300 py-1.5 px-2 rounded-lg transition-colors cursor-pointer"
        >
          <List className="w-4 h-4" />
          <span>List / 목록</span>
        </button>

        {/* Counter with arrows */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            disabled={index === 0}
            aria-label="Previous sentence"
            className="p-1 rounded-full text-purple-300 hover:text-amber-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-sm font-bold text-amber-300">
              Sentence {index + 1} / {totalSentences}
            </span>
            <span className="block text-[10px] text-purple-300/80 font-mono">
              {sentence.speaker} ({formatTime(sentence.start)} – {formatTime(sentence.end)})
            </span>
          </div>

          <button
            onClick={onNext}
            disabled={index === totalSentences - 1}
            aria-label="Next sentence"
            className="p-1 rounded-full text-purple-300 hover:text-amber-300 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="w-12 text-right">
          {progress?.status === 'done' ? (
            <span className="text-xs text-emerald-400 font-bold">★ Done</span>
          ) : progress?.status === 'practiced' ? (
            <span className="text-xs text-amber-400 font-medium">◐ Practiced</span>
          ) : (
            <span className="text-xs text-purple-400">☆ New</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* 6. Step Guide Tabs */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-1.5 bg-[#1b0932] p-1.5 rounded-xl border border-purple-800/50">
            {([1, 2, 3, 4] as StepNumber[]).map((step) => {
              const info = STEP_INSTRUCTIONS[step];
              const isActive = currentStep === step;
              return (
                <button
                  key={step}
                  onClick={() => handleSelectStep(step)}
                  className={`py-2 px-1 rounded-lg text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[46px] ${
                    isActive
                      ? 'bg-amber-500 text-purple-950 font-extrabold shadow-md'
                      : 'text-purple-300 hover:text-purple-100 hover:bg-purple-900/40'
                  }`}
                >
                  <span className="text-xs leading-none">Step {step}</span>
                  <span className="text-[10px] opacity-90 leading-tight mt-0.5">
                    {step === 1 ? 'Listen' : step === 2 ? 'Mumble' : step === 3 ? 'Read' : 'Shadow'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current step explanation */}
          <div className="px-3 py-2 bg-[#210c3c]/80 rounded-xl border border-purple-800/40 text-xs flex items-center justify-between">
            <div>
              <p className="font-semibold text-amber-200">
                {STEP_INSTRUCTIONS[currentStep].titleEn} ({STEP_INSTRUCTIONS[currentStep].titleKo})
              </p>
              <p className="text-purple-300/80 text-[11px] mt-0.5">
                {STEP_INSTRUCTIONS[currentStep].descEn}
              </p>
              <p className="text-purple-300/60 text-[10px]">
                {STEP_INSTRUCTIONS[currentStep].descKo}
              </p>
            </div>
            <button
              onClick={() => setIsTextHidden(!isTextHidden)}
              className="ml-2 px-2 py-1 rounded-md bg-purple-900/60 hover:bg-purple-900 text-[11px] text-amber-300 shrink-0 flex items-center gap-1 cursor-pointer"
            >
              {isTextHidden ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{isTextHidden ? "Show Text" : "Hide Text"}</span>
            </button>
          </div>
        </div>

        {/* 3. Sentence Text Box (Large font >= 22px, stress in bold) */}
        <div className="bg-[#240d42] border border-amber-500/30 rounded-2xl p-5 shadow-lg relative min-h-[120px] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-purple-300/70 mb-2">
            <span className="font-semibold text-amber-300/90 tracking-wide uppercase text-[11px]">
              Speaker: {sentence.speaker}
            </span>
            <button
              onClick={() => setIsKoreanHidden(!isKoreanHidden)}
              className="text-purple-400 hover:text-purple-200 transition-colors text-[11px] cursor-pointer"
            >
              {isKoreanHidden ? "Show Meaning / 뜻 보기" : "Hide Meaning / 뜻 숨기기"}
            </button>
          </div>

          {/* Text reveal/hidden */}
          <div className="my-2">
            {isTextHidden ? (
              <div
                onClick={() => setIsTextHidden(false)}
                className="py-4 px-3 rounded-xl bg-purple-950/60 border border-purple-800/40 text-center text-purple-400 italic cursor-pointer hover:bg-purple-900/40 transition-colors"
              >
                <EyeOff className="w-5 h-5 mx-auto mb-1 text-purple-400/80" />
                <p className="text-sm font-medium">Text is hidden for shadowing practice.</p>
                <p className="text-xs text-amber-400/80 mt-0.5">Tap here to reveal / 터치하여 문장 확인</p>
              </div>
            ) : (
              <p
                className="text-2xl sm:text-[26px] font-medium text-purple-50 leading-relaxed tracking-wide select-text"
                data-testid="practice-sentence-text"
              >
                {renderSentenceWithStress()}
              </p>
            )}
          </div>

          {/* 4. Korean meaning */}
          {!isKoreanHidden && (
            <p className="text-sm text-purple-300/80 border-t border-purple-900/40 pt-2 leading-relaxed">
              {sentence.korean}
            </p>
          )}
        </div>

        {/* 5. Control Row: Play, Loop, Speed (0.5x, 0.75x, 1.0x) */}
        <div className="bg-[#1f0b38] border border-purple-800/60 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-md">
          {/* Play/Pause Segment Button */}
          <button
            onClick={handlePlay}
            className="min-h-[48px] px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow transition-all active:scale-95 cursor-pointer"
            data-testid="play-segment-btn"
          >
            {player.isPlaying ? (
              <>
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <div className="text-left">
                  <span className="block leading-none">Playing</span>
                  <span className="text-[10px] font-medium text-purple-900/80">재생 중</span>
                </div>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <div className="text-left">
                  <span className="block leading-none">Play Clip</span>
                  <span className="text-[10px] font-medium text-purple-900/80">구간 재생</span>
                </div>
              </>
            )}
          </button>

          {/* Dedicated Voice Audio Button */}
          <button
            onClick={() => player.speakFallback(sentence.text)}
            className="min-h-[48px] px-3.5 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 border border-purple-700/80 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Listen to native voice pronunciation"
            data-testid="speak-voice-btn"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <div className="text-left">
              <span className="block leading-none">Voice</span>
              <span className="text-[10px] text-purple-300">음성 듣기</span>
            </div>
          </button>

          {/* Loop toggle */}
          <button
            onClick={handleToggleLoop}
            className={`min-h-[48px] px-3.5 py-2 rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
              isLooping
                ? 'bg-purple-700/80 border-amber-400 text-amber-300 shadow-inner'
                : 'bg-purple-900/40 border-purple-700/60 text-purple-300 hover:text-purple-100'
            }`}
            data-testid="loop-toggle-btn"
          >
            <Repeat className={`w-4 h-4 ${isLooping ? 'animate-spin' : ''}`} />
            <div className="text-left text-xs">
              <span className="font-semibold block leading-tight">
                {isLooping ? 'Loop ON' : 'Loop OFF'}
              </span>
              <span className="text-[10px] text-purple-300/80">1.5초 반복</span>
            </div>
          </button>

          {/* Speed selector */}
          <div className="flex items-center gap-1 bg-purple-950/70 p-1 rounded-xl border border-purple-800/60">
            {[0.5, 0.75, 1.0].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`min-h-[40px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  player.playbackRate === speed
                    ? 'bg-amber-500 text-purple-950 shadow-sm'
                    : 'text-purple-300 hover:text-amber-300'
                }`}
              >
                {speed}×
              </button>
            ))}
          </div>
        </div>

        {/* 7. Record Area */}
        <div className="bg-[#210c3b] border border-purple-800/60 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-200">
              <Mic className="w-4 h-4 text-amber-400" />
              <span>Record & Compare / 녹음 및 비교</span>
            </div>
            {progress?.recordings ? (
              <span className="text-xs text-purple-300/80">
                🎙 {progress.recordings} tries
              </span>
            ) : null}
          </div>

          {/* Permission Denied Notice */}
          {permissionDenied && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mic is off. You can still listen and shadow out loud. / 마이크 권한이 꺼져 있습니다. 소리 내어 쉐도잉을 계속할 수 있습니다.</span>
            </div>
          )}

          {/* Record Button */}
          <button
            onClick={handleToggleRecord}
            className={`w-full min-h-[50px] py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : 'bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white'
            }`}
            data-testid="record-btn"
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <div className="text-center">
                  <span className="block leading-none">Stop Recording / 녹음 중지</span>
                  <span className="text-[11px] font-normal opacity-90">Playing & Recording Voice...</span>
                </div>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <div className="text-center">
                  <span className="block leading-none">
                    {audioUrl ? 'Record Again / 다시 녹음' : 'Record / 녹음 시작'}
                  </span>
                  <span className="text-[11px] font-normal opacity-85">
                    동시에 재생되며 내 목소리가 녹음됩니다
                  </span>
                </div>
              </>
            )}
          </button>

          {/* Playback Row: My Voice vs Original */}
          {audioUrl && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={isPlayingVoice ? stopMyVoice : playMyVoice}
                className={`min-h-[46px] py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isPlayingVoice
                    ? 'bg-purple-600 border-amber-300 text-amber-200 shadow'
                    : 'bg-purple-900/60 hover:bg-purple-900 border-purple-700 text-purple-100'
                }`}
                data-testid="play-my-voice-btn"
              >
                <Volume2 className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <span className="block leading-none">
                    {isPlayingVoice ? 'Playing Voice' : '▶ My Voice'}
                  </span>
                  <span className="text-[10px] text-purple-300 font-normal">내 목소리 듣기</span>
                </div>
              </button>

              <button
                onClick={() => player.playSegment(sentence.start, sentence.end, false)}
                className="min-h-[46px] py-2 px-3 rounded-xl border border-purple-700 bg-purple-900/60 hover:bg-purple-900 text-purple-100 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                data-testid="play-original-btn"
              >
                <Play className="w-4 h-4 text-amber-400 fill-current" />
                <div className="text-left">
                  <span className="block leading-none">▶ Original</span>
                  <span className="text-[10px] text-purple-300 font-normal">배우 목소리 듣기</span>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* 8. Self-Check (after recording or self-evaluation) */}
        <div className="bg-[#1e0b38] border border-purple-800/60 rounded-2xl p-4 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
              Self-Check / 스스로 평가하기
            </h3>
            <span className="text-[11px] text-purple-300/70">😀 Good · 🙂 Fair · 😐 Need Practice</span>
          </div>

          <div className="space-y-2.5">
            {selfCheckQuestions.map((q, qIdx) => {
              const currentScore = progress?.selfCheck?.[qIdx as 0 | 1 | 2];
              return (
                <div
                  key={qIdx}
                  className="bg-[#17082a] p-2.5 rounded-xl border border-purple-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="text-xs">
                    <p className="font-medium text-purple-100">{q.labelEn}</p>
                    <p className="text-[11px] text-purple-300/70">{q.labelKo}</p>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      onClick={() => handleSelfCheck(qIdx as 0 | 1 | 2, 'good')}
                      className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        currentScore === 'good'
                          ? 'bg-emerald-500 text-purple-950 shadow-md ring-2 ring-emerald-300'
                          : 'bg-purple-950/80 hover:bg-purple-900 text-purple-300'
                      }`}
                      title="Good / 잘함"
                      aria-label={`${q.labelEn} Good`}
                    >
                      <Smile className="w-4 h-4" />
                      <span>😀 Good</span>
                    </button>

                    <button
                      onClick={() => handleSelfCheck(qIdx as 0 | 1 | 2, 'fair')}
                      className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        currentScore === 'fair'
                          ? 'bg-amber-500 text-purple-950 shadow-md ring-2 ring-amber-300'
                          : 'bg-purple-950/80 hover:bg-purple-900 text-purple-300'
                      }`}
                      title="Fair / 보통"
                      aria-label={`${q.labelEn} Fair`}
                    >
                      <Meh className="w-4 h-4" />
                      <span>🙂 Fair</span>
                    </button>

                    <button
                      onClick={() => handleSelfCheck(qIdx as 0 | 1 | 2, 'need_practice')}
                      className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        currentScore === 'need_practice'
                          ? 'bg-purple-700 text-amber-200 shadow-md ring-2 ring-amber-400'
                          : 'bg-purple-950/80 hover:bg-purple-900 text-purple-300'
                      }`}
                      title="Need Practice / 더 연습"
                      aria-label={`${q.labelEn} Need practice`}
                    >
                      <Frown className="w-4 h-4" />
                      <span>😐 More</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 9. Word Check (Web Speech API - optional) */}
        {isSpeechSupported && (
          <div className="bg-[#1b0932] border border-purple-800/50 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Word Check (Optional) / 발음 단어 체크</span>
              </div>
              <span className="text-[10px] text-purple-400">Web Speech API</span>
            </div>

            <p className="text-xs text-purple-300/80">
              Speak into the mic to see which words were recognized in your speech.
            </p>

            <button
              onClick={handleCheckWords}
              className={`min-h-[46px] w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isCheckingWords
                  ? 'bg-amber-500 border-amber-300 text-purple-950 animate-pulse'
                  : 'bg-purple-900/50 hover:bg-purple-900 border-purple-700 text-purple-200'
              }`}
              data-testid="check-my-words-btn"
            >
              <Radio className={`w-4 h-4 ${isCheckingWords ? 'animate-spin' : ''}`} />
              <span>
                {isCheckingWords
                  ? 'Listening... Speak now! / 듣고 있어요! 말해보세요'
                  : 'Check My Words / 내 발음 단어 확인'}
              </span>
            </button>

            {speechError && (
              <p className="text-xs text-amber-400/80">{speechError}</p>
            )}

            {/* Word match visualization */}
            {matchResult && (
              <div className="p-3 bg-[#130623] rounded-xl border border-purple-800/40 space-y-2">
                <div className="flex flex-wrap gap-1.5 text-sm sm:text-base">
                  {matchResult.words.map((w, wIdx) => (
                    <span
                      key={wIdx}
                      className={`px-1.5 py-0.5 rounded ${
                        w.matched
                          ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-500/40'
                          : 'text-purple-400/70 underline decoration-purple-500/50 decoration-1 underline-offset-2'
                      }`}
                    >
                      {w.original}
                    </span>
                  ))}
                </div>

                <div className="pt-1.5 border-t border-purple-900/50 flex items-center justify-between text-xs text-purple-200">
                  <span className="text-emerald-300 font-semibold">
                    You said {matchResult.matchedCount} of {matchResult.totalCount} words!
                  </span>
                  <span className="text-purple-400 text-[11px]">Keep going! 아주 좋아요!</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 10. Sticky Bottom Navigation: Prev / Next */}
      <div className="p-4 bg-[#18082c]/95 border-t border-purple-900/60 sticky bottom-0 backdrop-blur-md flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="min-h-[48px] py-2.5 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-900 border border-purple-700 text-purple-200 text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous / 이전</span>
        </button>

        {index < totalSentences - 1 ? (
          <button
            onClick={onNext}
            className="flex-1 min-h-[48px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-purple-950 text-sm font-extrabold shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            data-testid="next-sentence-btn"
          >
            <span>Next Sentence / 다음 문장</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onFinishSession}
            className="flex-1 min-h-[48px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-purple-950 text-sm font-extrabold shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            data-testid="finish-session-btn"
          >
            <span>Finish Session / 학습 완료</span>
            <Check className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
