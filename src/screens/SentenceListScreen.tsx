import React, { useState } from 'react';
import { Sentence, SentenceProgress } from '../types';
import { formatTime } from '../utils/shadowing';
import { Play, ArrowLeft, Settings, Eye, EyeOff, Sparkles, CheckCircle, Clock } from 'lucide-react';

interface SentenceListScreenProps {
  sentences: Sentence[];
  progressMap: Record<number, SentenceProgress>;
  onSelectSentence: (index: number) => void;
  onBackToStart: () => void;
  onGoToEdit: () => void;
}

export const SentenceListScreen: React.FC<SentenceListScreenProps> = ({
  sentences,
  progressMap,
  onSelectSentence,
  onBackToStart,
  onGoToEdit,
}) => {
  const [hideAllText, setHideAllText] = useState(false);

  // Helper for progress icon
  const getProgressBadge = (prog?: SentenceProgress) => {
    if (!prog || prog.status === 'new') {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-950/70 border border-purple-800 text-purple-300">
          <span>☆</span>
          <span className="text-[10px]">New / 시작 전</span>
        </span>
      );
    }
    if (prog.status === 'practiced') {
      return (
        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300">
          <span>◐</span>
          <span className="text-[10px]">Practiced / 연습함</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold">
        <span>★</span>
        <span className="text-[10px]">Done / 완료</span>
      </span>
    );
  };

  const completedCount = sentences.filter((s) => progressMap[s.id]?.status === 'done').length;

  return (
    <div className="flex flex-col min-h-screen bg-[#150727] text-purple-100 pb-12">

      {/* Nav & Header bar */}
      <div className="px-4 py-3 bg-[#1e0b37] border-b border-purple-800/60 flex items-center justify-between">
        <button
          onClick={onBackToStart}
          className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-amber-300 py-1 px-2 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home / 시작</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm font-bold text-amber-200">Sentence List / 문장 목록</h2>
          <p className="text-[11px] text-purple-300/80">
            {completedCount} / {sentences.length} Completed
          </p>
        </div>

        <button
          onClick={onGoToEdit}
          className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-amber-300 py-1 px-2.5 rounded-lg transition-colors cursor-pointer bg-purple-900/40 hover:bg-purple-900/70"
          title="Edit Sentences"
          aria-label="Edit Sentences"
          data-testid="go-to-edit-btn"
        >
          <Settings className="w-4 h-4 text-amber-300" />
          <span>Edit / 편집</span>
        </button>
      </div>

      {/* List controls */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-purple-300/80 border-b border-purple-900/30">
        <span>Tap any card to start shadowing</span>
        <button
          onClick={() => setHideAllText(!hideAllText)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-900/70 text-purple-200 text-xs transition-colors cursor-pointer"
        >
          {hideAllText ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{hideAllText ? "Show All Text / 문장 보이기" : "Hide All Text / 문장 숨기기"}</span>
        </button>
      </div>

      {/* Sentence Cards List */}
      <div className="p-4 space-y-3 flex-1">
        {sentences.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[#200c3a]/60 rounded-2xl border border-purple-800/40">
            <p className="text-sm text-purple-200 mb-2">No sentences yet.</p>
            <p className="text-xs text-purple-300/70 mb-4">문장이 아직 없습니다. 문장 편집에서 추가해보세요.</p>
            <button
              onClick={onGoToEdit}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold text-xs"
            >
              Add Sentences / 문장 추가
            </button>
          </div>
        ) : (
          sentences.map((sentence, idx) => {
            const prog = progressMap[sentence.id];
            return (
              <div
                key={sentence.id}
                onClick={() => onSelectSentence(idx)}
                className="group relative bg-[#220c3d]/90 hover:bg-[#2c104e] border border-purple-800/60 hover:border-amber-500/50 rounded-2xl p-4 shadow-md transition-all active:scale-[0.99] cursor-pointer"
                data-testid={`sentence-card-${idx}`}
              >
                {/* Header line: number, speaker, time range, progress */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-purple-200">
                      {sentence.speaker}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-purple-300/70 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      {formatTime(sentence.start)} – {formatTime(sentence.end)}
                    </span>
                    {getProgressBadge(prog)}
                  </div>
                </div>

                {/* Sentence English text */}
                <div className="mt-1">
                  {hideAllText ? (
                    <div className="py-2 px-3 bg-purple-950/60 rounded-lg text-xs text-purple-400/80 italic flex items-center gap-2">
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Text hidden / 문장 숨김 (Tap to practice)</span>
                    </div>
                  ) : (
                    <p className="text-base sm:text-lg font-medium text-amber-100 leading-snug">
                      {sentence.text}
                    </p>
                  )}
                </div>

                {/* Korean translation */}
                {!hideAllText && (
                  <p className="text-xs text-purple-300/80 mt-1.5 leading-relaxed">
                    {sentence.korean}
                  </p>
                )}

                {/* Quick arrow */}
                <div className="mt-2.5 pt-2 border-t border-purple-900/40 flex items-center justify-between text-[11px] text-purple-400">
                  <span>
                    {prog?.recordings ? `🎙 ${prog.recordings} recordings` : 'Not recorded yet'}
                  </span>
                  <span className="text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                    Practice ◀▶
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Bottom Action */}
      {sentences.length > 0 && (
        <div className="p-4 bg-[#18082c]/95 border-t border-purple-900/60 sticky bottom-0 backdrop-blur-md">
          <button
            onClick={() => onSelectSentence(0)}
            className="w-full min-h-[50px] py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-purple-950 font-bold text-sm shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="flex items-center gap-2 text-base font-extrabold">
              <Play className="w-4 h-4 fill-current" />
              <span>Practice From #1 / 1번부터 연습</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
