import React from 'react';
import { MOVIE_INFO } from '../data/constants';
import { CreditLine } from './CreditLine';
import { ExternalLink, AlertCircle, Film, Volume2, Sparkles, RefreshCw } from 'lucide-react';

interface VideoPlayerCardProps {
  containerId: string;
  embedFailed: boolean;
  isPlaying?: boolean;
  currentTime?: number;
  currentSentenceTime?: string;
  onPlayAudioFallback?: () => void;
  onRetryEmbed?: () => void;
}

export const VideoPlayerCard: React.FC<VideoPlayerCardProps> = ({
  containerId,
  embedFailed,
  isPlaying,
  currentTime = 0,
  currentSentenceTime,
  onPlayAudioFallback,
  onRetryEmbed,
}) => {
  return (
    <div className="w-full bg-[#160728] shadow-md border-b border-purple-900/50">
      <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden">
        {/* YouTube Container Element */}
        <div
          id={containerId}
          className="w-full h-full"
          data-testid="youtube-iframe-container"
        />

        {/* Fallback View if Embedding is restricted by YouTube (e.g. Error 150/153) */}
        {embedFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-[#1b0933]/95 text-purple-100 z-20 backdrop-blur-sm">
            <AlertCircle className="w-8 h-8 text-amber-400 mb-1.5 shrink-0" />
            <p className="text-sm font-bold text-amber-200">
              This video can't play inside the app.
            </p>
            <p className="text-[11px] text-purple-300/80 mb-3 max-w-xs">
              보안 및 저작권 정책으로 영상이 앱 안에서 차단된 경우, 유튜브에서 원본을 열거나 아래 원어민 음성으로 바로 쉐도잉할 수 있습니다.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs">
              {/* Mandatory Fallback Button: Open on YouTube */}
              <a
                href={`https://www.youtube.com/watch?v=${MOVIE_INFO.videoId}&t=${Math.floor(currentTime || MOVIE_INFO.start)}s`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Tap to open it on YouTube</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {/* Native Voice Audio Fallback */}
              {onPlayAudioFallback && (
                <button
                  onClick={onPlayAudioFallback}
                  className="w-full min-h-[44px] py-2 px-3 rounded-xl bg-purple-800/80 hover:bg-purple-700 text-amber-200 font-semibold text-xs border border-purple-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Play Voice Audio / 음성 재생</span>
                </button>
              )}
            </div>

            {onRetryEmbed && (
              <button
                onClick={onRetryEmbed}
                className="mt-2 text-[11px] text-purple-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry Player / 플레이어 재시도</span>
              </button>
            )}
          </div>
        )}

        {/* Top-Right Badge: Scene Length / Current Segment */}
        <div className="absolute top-2 right-2 pointer-events-none flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-[11px] text-amber-300 z-10">
          <Film className="w-3 h-3 text-amber-400" />
          <span>{currentSentenceTime || "0:00 – 0:52"}</span>
        </div>

        {/* Top-Left: Direct YouTube link button */}
        <a
          href={`https://www.youtube.com/watch?v=${MOVIE_INFO.videoId}&t=${Math.floor(currentTime || MOVIE_INFO.start)}s`}
          target="_blank"
          rel="noopener noreferrer"
          title="Watch scene on YouTube"
          className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-[11px] text-purple-200 hover:text-amber-300 transition-colors z-10"
        >
          <ExternalLink className="w-3 h-3 text-amber-400" />
          <span>YouTube</span>
        </a>
      </div>

      {/* Mandatory one-line credit under video */}
      <CreditLine className="bg-[#120522]/90 border-t border-purple-950/40" />
    </div>
  );
};
