export interface Sentence {
  id: number;
  speaker: string;
  text: string;
  korean: string;
  stress: string[];
  start: number;
  end: number;
}

export type SelfCheckScore = 'good' | 'fair' | 'need_practice' | null;

export interface SentenceProgress {
  id: number;
  plays: number;
  recordings: number;
  selfCheck: [SelfCheckScore, SelfCheckScore, SelfCheckScore]; // [speed, stress, intonation]
  status: 'new' | 'practiced' | 'done';
}

export type StepNumber = 1 | 2 | 3 | 4;

export type ScreenType = 'start' | 'list' | 'practice' | 'edit' | 'finish';

export interface MovieInfo {
  titleEn: string;
  titleKo: string;
  year: number;
  director: string;
  screenplay: string;
  production: string;
  distribution: string;
  sceneDescription: string;
  youtubeTitle: string;
  youtubeChannel: string;
  youtubeUrl: string;
  videoId: string;
  start: number;
  end: number;
  madeBy: string;
  creditLine: string;
}
