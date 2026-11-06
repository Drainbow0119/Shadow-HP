import React, { useState } from 'react';
import { MOVIE_INFO } from '../data/constants';
import { formatTime } from '../utils/shadowing';
import { ExternalLink, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export const EducationalNoticeCard: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section
      aria-labelledby="edu-notice-heading"
      className="bg-[#24103c]/90 border border-amber-500/30 rounded-2xl p-4 text-left shadow-lg text-purple-100 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-2 border-b border-purple-800/60 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" aria-hidden="true" />
          <h2 id="edu-notice-heading" className="text-base font-bold text-amber-300">
            Educational Use & Source / 교육용 고지 및 출처
          </h2>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="text-purple-300 hover:text-amber-300 p-1 rounded-lg transition-colors"
          title={isExpanded ? "Collapse notice" : "Expand notice"}
        >
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-4 text-[13px] leading-relaxed text-purple-200/90">
          {/* Section 0-2 Notice */}
          <div className="bg-[#18092a]/80 p-3 rounded-xl border border-purple-800/40 space-y-2">
            <div>
              <p className="font-semibold text-amber-200">Educational use only / 교육 목적 전용</p>
              <p className="text-purple-200/80 mt-0.5">
                This app was made <strong>only for non-commercial English learning</strong> in the university course <em>AI and English Language Education</em> (ENG3088, Sungkyunkwan University). The film clip is used <strong>only to practice listening and speaking (shadowing)</strong>. It is not sold, shared for profit, downloaded, or edited. All rights to the film belong to its copyright holders.
              </p>
            </div>
            <div className="pt-2 border-t border-purple-900/50">
              <p className="text-purple-200/80">
                이 앱은 성균관대학교 「인공지능과 영어교육」(ENG3088) 수업의 <strong>비영리 영어 학습 목적으로만</strong> 제작되었습니다. 영화 장면은 듣기·말하기(쉐도잉) 연습에만 사용하며, 판매·영리적 배포·다운로드·편집을 하지 않습니다. 영화의 모든 권리는 저작권자에게 있습니다.
              </p>
            </div>
          </div>

          {/* Section 0-1 Metadata lines */}
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">Movie Title / 영화 제목:</span>
              <span className="font-medium text-amber-200">
                {MOVIE_INFO.titleEn} ({MOVIE_INFO.titleKo})
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">Release Year / 개봉 연도:</span>
              <span className="text-purple-100">{MOVIE_INFO.year}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">Director / 감독:</span>
              <span className="text-purple-100">{MOVIE_INFO.director}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">Screenplay / 각본:</span>
              <span className="text-purple-100">{MOVIE_INFO.screenplay}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">Production / 제작:</span>
              <span className="text-purple-100">{MOVIE_INFO.production}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">Distribution / 배급:</span>
              <span className="text-purple-100">{MOVIE_INFO.distribution}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">Scene / 장면 설명:</span>
              <span className="text-amber-200">{MOVIE_INFO.sceneDescription}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">Practice Range / 학습 구간:</span>
              <span className="text-amber-300 font-semibold">
                {formatTime(MOVIE_INFO.start)} – {formatTime(MOVIE_INFO.end)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">YouTube Video / 영상:</span>
              <span className="text-purple-100 line-clamp-1">{MOVIE_INFO.youtubeTitle}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">Channel / 채널:</span>
              <span className="text-purple-100">{MOVIE_INFO.youtubeChannel}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-purple-900/30">
              <span className="text-purple-300/70">Made by / 제작자:</span>
              <span className="font-semibold text-amber-300">{MOVIE_INFO.madeBy}</span>
            </div>
            <div className="pt-1.5 flex justify-end">
              <a
                href={MOVIE_INFO.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 hover:underline"
              >
                <span>Open Video on YouTube / 유튜브 원본 링크</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
