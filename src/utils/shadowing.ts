import { Sentence, SentenceProgress } from '../types';

/**
 * Formats seconds into "m:ss" or "m:ss.s" format.
 */
export function formatTime(seconds: number, includeTenths = false): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (includeTenths) {
    const wholeSecs = Math.floor(secs);
    const tenths = Math.floor((secs - wholeSecs) * 10);
    return `${mins}:${wholeSecs.toString().padStart(2, '0')}.${tenths}`;
  }
  return `${mins}:${Math.floor(secs).toString().padStart(2, '0')}`;
}

/**
 * Parses time string like "0:36", "36.5", "1:02.5" to seconds.
 */
export function parseTime(timeStr: string | number): number | null {
  if (typeof timeStr === 'number') {
    return isNaN(timeStr) ? null : timeStr;
  }
  if (!timeStr || typeof timeStr !== 'string') return null;
  const cleaned = timeStr.trim().toLowerCase().replace('o:', '0:'); // handles typo "o:36"

  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    if (parts.length !== 2) return null;
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (isNaN(mins) || isNaN(secs)) return null;
    return mins * 60 + secs;
  }

  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

/**
 * Normalizes a word for comparison by removing punctuation and lowercasing.
 */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, '')
    .trim();
}

export interface WordMatchResult {
  words: {
    original: string;
    normalized: string;
    isStress: boolean;
    matched: boolean;
  }[];
  matchedCount: number;
  totalCount: number;
  accuracyPercent: number;
}

/**
 * Compares recognized speech words against the target sentence.
 */
export function compareWords(
  targetText: string,
  recognizedText: string,
  stressWords: string[] = []
): WordMatchResult {
  const rawWords = targetText.trim().split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) {
    return {
      words: [],
      matchedCount: 0,
      totalCount: 0,
      accuracyPercent: 100,
    };
  }

  const normalizedStress = stressWords
    .flatMap((s) => s.split(/\s+/))
    .map(normalizeWord)
    .filter(Boolean);

  const recognizedTokens = recognizedText
    .trim()
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  // We can track matches using a greedy pool or ordered matching
  const recognizedPool = [...recognizedTokens];

  const words = rawWords.map((rawWord) => {
    const norm = normalizeWord(rawWord);
    const isStress = normalizedStress.includes(norm);

    // Look for match in recognized pool
    const matchIndex = recognizedPool.indexOf(norm);
    let matched = false;
    if (matchIndex !== -1) {
      matched = true;
      // remove matched token so duplicate words in sentence match accurately
      recognizedPool.splice(matchIndex, 1);
    }

    return {
      original: rawWord,
      normalized: norm,
      isStress,
      matched,
    };
  });

  const matchedCount = words.filter((w) => w.matched).length;
  const totalCount = words.length;
  const accuracyPercent = Math.round((matchedCount / totalCount) * 100);

  return {
    words,
    matchedCount,
    totalCount,
    accuracyPercent,
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a sentence entry within boundaries and checks recommendations.
 */
export function validateSentence(
  sentence: Partial<Sentence>,
  minRange: number,
  maxRange: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!sentence.speaker || !sentence.speaker.trim()) {
    errors.push("Speaker name is required / 화자 이름을 입력해주세요.");
  }
  if (!sentence.text || !sentence.text.trim()) {
    errors.push("English sentence text is required / 영어 문장을 입력해주세요.");
  }
  if (!sentence.korean || !sentence.korean.trim()) {
    errors.push("Korean translation is required / 한국어 번역을 입력해주세요.");
  }

  const start = sentence.start;
  const end = sentence.end;

  if (start === undefined || isNaN(start)) {
    errors.push("Start time is required / 시작 시간을 입력해주세요.");
  } else if (start < minRange || start > maxRange) {
    errors.push(`Start time must be between ${formatTime(minRange)} and ${formatTime(maxRange)}.`);
  }

  if (end === undefined || isNaN(end)) {
    errors.push("End time is required / 종료 시간을 입력해주세요.");
  } else if (end < minRange || end > maxRange) {
    errors.push(`End time must be between ${formatTime(minRange)} and ${formatTime(maxRange)}.`);
  }

  if (start !== undefined && end !== undefined && !isNaN(start) && !isNaN(end)) {
    if (end <= start) {
      errors.push("End time must be greater than start time / 종료 시간은 시작 시간보다 커야 합니다.");
    } else {
      const duration = end - start;
      if (duration > 4.0) {
        warnings.push(`Sentence is ${duration.toFixed(1)}s long. Recommended: under 4.0 seconds for optimal shadowing.`);
      }
    }
  }

  if (sentence.text) {
    const wordCount = sentence.text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 12) {
      warnings.push(`Sentence has ${wordCount} words. Recommended: under 12 words for easy shadowing.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export interface ProgressSummary {
  completedCount: number;
  practicedCount: number;
  totalRecordings: number;
  needsPracticeIds: number[];
}

/**
 * Calculates learning stats from progress records.
 */
export function calculateProgressSummary(
  sentences: Sentence[],
  progressMap: Record<number, SentenceProgress>
): ProgressSummary {
  let completedCount = 0;
  let practicedCount = 0;
  let totalRecordings = 0;
  const needsPracticeIds: number[] = [];

  sentences.forEach((sentence) => {
    const prog = progressMap[sentence.id];
    if (prog) {
      if (prog.status === 'done') {
        completedCount++;
      } else if (prog.status === 'practiced') {
        practicedCount++;
      }
      totalRecordings += prog.recordings || 0;

      // Check if any selfCheck is 'need_practice' (😐)
      const hasNeedPractice = prog.selfCheck && prog.selfCheck.some((score) => score === 'need_practice');
      if (hasNeedPractice) {
        needsPracticeIds.push(sentence.id);
      }
    }
  });

  return {
    completedCount,
    practicedCount,
    totalRecordings,
    needsPracticeIds,
  };
}
