import React from 'react';
import { Sentence, SentenceProgress } from '../types';
import { CreditLine } from '../components/CreditLine';
import { calculateProgressSummary, formatTime } from '../utils/shadowing';
import {
  Trophy,
  Sparkles,
  RotateCcw,
  List,
  CheckCircle2,
  Mic,
  ArrowRight,
  Flame,
  Frown,
} from 'lucide-react';

interface FinishScreenProps {
  sentences: Sentence[];
  progressMap: Record<number, SentenceProgress>;
  onPracticeSentence: (index: number) => void;
  onPracticeAgainFromStart: () => void;
  onGoToList: () => void;
}

export const FinishScreen: React.FC<FinishScreenProps> = ({
  sentences,
  progressMap,
  onPracticeSentence,
  onPracticeAgainFromStart,
  onGoToList,
}) => {
  const summary = calculateProgressSummary(sentences, progressMap);

  // Find sentences that were marked with need_practice (😐)
  const needsPracticeSentences = sentences
    .map((s, idx) => ({ sentence: s, index: idx }))
    .filter(({ sentence }) => summary.needsPracticeIds.includes(sentence.id));

  return (
    <div className="flex flex-col min-h-screen bg-[#150727] text-purple-100 justify-between">
      <div className="p-4 space-y-6 flex-1">
        {/* Celebratory Hero Header */}
        <div className="text-center pt-8 pb-4 relative">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-xl shadow-amber-500/20 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-[#1b0933] rounded-[22px] flex items-center justify-center">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Session Completed / 학습 완료</span>
          </div>

          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 font-serif">
            Great Job! 수고하셨습니다!
          </h1>
          <p className="text-sm text-purple-300/80 mt-1">
            호그와트 첫날 장면 쉐도잉을 훌륭하게 완주했습니다.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-[#210c3b] border border-purple-800/60 p-3 rounded-2xl text-center shadow-md">
            <div className="w-8 h-8 mx-auto rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-1">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-amber-200">
              {summary.completedCount}
            </div>
            <div className="text-[11px] text-purple-300/80 leading-tight">
              Done (★)<br />완료 문장
            </div>
          </div>

          <div className="bg-[#210c3b] border border-purple-800/60 p-3 rounded-2xl text-center shadow-md">
            <div className="w-8 h-8 mx-auto rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mb-1">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-amber-200">
              {summary.practicedCount}
            </div>
            <div className="text-[11px] text-purple-300/80 leading-tight">
              Practiced (◐)<br />연습 문장
            </div>
          </div>

          <div className="bg-[#210c3b] border border-purple-800/60 p-3 rounded-2xl text-center shadow-md">
            <div className="w-8 h-8 mx-auto rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center mb-1">
              <Mic className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-amber-200">
              {summary.totalRecordings}
            </div>
            <div className="text-[11px] text-purple-300/80 leading-tight">
              Voice Takes<br />총 녹음 횟수
            </div>
          </div>
        </div>

        {/* Sentences marked 😐 (Need More Practice) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Frown className="w-4 h-4 text-purple-300" />
              <span>Sentences to Review (😐) / 복습 추천 문장</span>
            </span>
            <span className="text-purple-400 text-[11px]">
              {needsPracticeSentences.length} items
            </span>
          </div>

          {needsPracticeSentences.length === 0 ? (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center text-xs text-emerald-200">
              <p className="font-semibold">All checked sentences were rated Good or Fair! 🎉</p>
              <p className="text-emerald-300/70 text-[11px] mt-0.5">
                모든 문장을 자신감 있게 소화했습니다!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {needsPracticeSentences.map(({ sentence, index }) => (
                <div
                  key={sentence.id}
                  className="bg-[#210c3b] border border-purple-800/60 p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-purple-200 truncate">
                        {sentence.speaker}
                      </span>
                      <span className="text-[10px] text-purple-400 font-mono">
                        {formatTime(sentence.start)} – {formatTime(sentence.end)}
                      </span>
                    </div>
                    <p className="text-xs text-purple-100 font-medium truncate">
                      {sentence.text}
                    </p>
                  </div>

                  <button
                    onClick={() => onPracticeSentence(index)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer transition-all active:scale-95"
                    data-testid={`practice-again-btn-${sentence.id}`}
                  >
                    <span>Practice</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={onPracticeAgainFromStart}
            className="w-full min-h-[50px] py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-purple-950 font-bold text-sm shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="flex items-center gap-2 text-base font-extrabold">
              <RotateCcw className="w-4 h-4" />
              <span>Practice Again from Start / 처음부터 다시 연습</span>
            </div>
          </button>

          <button
            onClick={onGoToList}
            className="w-full min-h-[48px] py-2.5 px-4 rounded-xl bg-purple-900/60 hover:bg-purple-900 border border-purple-700 text-purple-100 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <List className="w-4 h-4 text-amber-300" />
            <span>Back to Sentence List / 문장 목록으로 돌아가기</span>
          </button>
        </div>
      </div>

      {/* Mandatory one-line credit at bottom */}
      <div className="pt-6 pb-4">
        <CreditLine />
      </div>
    </div>
  );
};
