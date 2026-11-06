import React from 'react';
import { MOVIE_INFO } from '../data/constants';
import { EducationalNoticeCard } from '../components/EducationalNoticeCard';
import { Sparkles, Play, List, Settings, Mic, Volume2, Flame } from 'lucide-react';

interface StartScreenProps {
  onStartPractice: () => void;
  onGoToList: () => void;
  onGoToEdit: () => void;
  sentenceCount: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartPractice,
  onGoToList,
  onGoToEdit,
  sentenceCount,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#150727] text-purple-100 pb-12">
      {/* Decorative magical header glow */}
      <div className="relative pt-10 pb-6 px-4 text-center overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-44 bg-purple-600/20 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-500/15 blur-2xl pointer-events-none rounded-full" />

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-900/60 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Hogwarts Movie Clip Shadowing</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 tracking-tight font-serif drop-shadow">
          Scene Shadow: Harry Potter
        </h1>

        <p className="mt-2 text-lg font-medium text-purple-200/90">
          "Listen. Copy. Speak at the same time."
        </p>
        <p className="text-xs text-purple-300/70 mt-1">
          듣고, 흉내 내며, 배우와 동시에 말하는 쉐도잉 영어 학습기
        </p>
      </div>

      {/* Main Content Area */}
      <div className="px-4 space-y-6 flex-1 flex flex-col justify-between">
        {/* Why Scene & What is Shadowing Card */}
        <div className="space-y-4">
          <div className="bg-[#210c3b]/80 border border-purple-800/60 rounded-2xl p-4 shadow-md">
            <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>What is Shadowing? / 쉐도잉이란?</span>
            </h2>
            <ul className="space-y-2.5 text-xs text-purple-200/90 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-semibold text-purple-100">Listen & speak simultaneously / 듣고 거의 동시에 따라 말하기</p>
                  <p className="text-purple-300/70 text-[11px]">Copy the native speaker's speed, pauses, and tone with a slight delay.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-semibold text-purple-100">Catch rhythm and stress / 리듬, 박자, 강세 살리기</p>
                  <p className="text-purple-300/70 text-[11px]">Feel where native actors raise their pitch and emphasize key words.</p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-semibold text-purple-100">Mouth muscle training / 입 근육과 호흡 훈련</p>
                  <p className="text-purple-300/70 text-[11px]">Practice short lines repeatedly so the phrases flow out naturally.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Scene highlight snippet */}
          <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-amber-200">Scene: {MOVIE_INFO.sceneDescription}</p>
                <p className="text-purple-300/70 text-[11px]">
                  {MOVIE_INFO.titleEn} (0:00 – 0:52) · {sentenceCount} sentences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Big Start Practice Button */}
          <button
            onClick={onStartPractice}
            className="w-full min-h-[54px] py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-purple-950 font-bold text-base shadow-lg shadow-amber-500/20 hover:brightness-105 active:scale-[0.98] transition-all flex flex-col items-center justify-center cursor-pointer"
            data-testid="start-practice-btn"
          >
            <div className="flex items-center gap-2 text-lg font-extrabold tracking-wide">
              <Play className="w-5 h-5 fill-current" />
              <span>Start Practice</span>
            </div>
            <span className="text-[12px] font-semibold text-purple-900/80 -mt-0.5">
              연습 시작
            </span>
          </button>

          {/* Secondary Button: Sentence List */}
          <button
            onClick={onGoToList}
            className="w-full min-h-[48px] py-2.5 px-4 rounded-xl bg-purple-900/50 hover:bg-purple-900/80 text-purple-100 font-semibold border border-purple-700/60 transition-all flex flex-col items-center justify-center cursor-pointer active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 text-sm">
              <List className="w-4 h-4 text-amber-300" />
              <span>Sentence List</span>
            </div>
            <span className="text-[11px] text-purple-300/80 -mt-0.5">전체 문장 목록</span>
          </button>

          {/* Small link: Edit Sentences */}
          <div className="text-center pt-1">
            <button
              onClick={onGoToEdit}
              className="inline-flex items-center gap-1.5 text-xs text-purple-300/80 hover:text-amber-300 transition-colors py-1 px-3 rounded-lg cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Edit Sentences / 문장 편집</span>
            </button>
          </div>
        </div>

        {/* Section 0-3 Educational Notice & Source Card */}
        <div className="pt-4">
          <EducationalNoticeCard />
        </div>
      </div>
    </div>
  );
};
