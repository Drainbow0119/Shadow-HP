import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  parseTime,
  normalizeWord,
  compareWords,
  validateSentence,
  calculateProgressSummary,
} from './shadowing';
import { Sentence, SentenceProgress } from '../types';

test('formatTime formats seconds properly', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(2.5), '0:02');
  assert.equal(formatTime(2.5, true), '0:02.5');
  assert.equal(formatTime(65), '1:05');
  assert.equal(formatTime(-1), '0:00');
});

test('parseTime handles various time inputs correctly', () => {
  assert.equal(parseTime('0:02'), 2);
  assert.equal(parseTime('0:36.5'), 36.5);
  assert.equal(parseTime('o:36'), 36); // handle user typo
  assert.equal(parseTime('1:10'), 70);
  assert.equal(parseTime('42'), 42);
  assert.equal(parseTime(42.5), 42.5);
  assert.equal(parseTime('invalid'), null);
});

test('normalizeWord removes punctuation and lowercases', () => {
  assert.equal(normalizeWord("Hello!"), "hello");
  assert.equal(normalizeWord("teacher?"), "teacher");
  assert.equal(normalizeWord("Dumbledore's"), "dumbledores");
  assert.equal(normalizeWord("Quirrell..."), "quirrell");
});

test('compareWords matches recognized speech accurately', () => {
  const target = "Your attention, please.";
  const recognized = "your attention please";
  const result = compareWords(target, recognized, ["attention"]);

  assert.equal(result.totalCount, 3);
  assert.equal(result.matchedCount, 3);
  assert.equal(result.accuracyPercent, 100);
  assert.equal(result.words[1].isStress, true);
  assert.equal(result.words[1].matched, true);

  const partial = compareWords("Let the feast begin.", "let begin", ["feast"]);
  assert.equal(partial.totalCount, 4);
  assert.equal(partial.matchedCount, 2);
  assert.equal(partial.words[0].matched, true); // let
  assert.equal(partial.words[1].matched, false); // the
  assert.equal(partial.words[2].matched, false); // feast
  assert.equal(partial.words[3].matched, true); // begin
});

test('validateSentence correctly validates bounds and warnings', () => {
  const validSentence: Partial<Sentence> = {
    speaker: "Harry Potter",
    text: "What's he teach?",
    korean: "가르치시는 과목이 뭐야?",
    start: 43.0,
    end: 44.2,
  };
  const res = validateSentence(validSentence, 0, 52);
  assert.equal(res.valid, true);
  assert.equal(res.errors.length, 0);

  // Out of bounds
  const outOfBounds: Partial<Sentence> = {
    speaker: "Harry",
    text: "Testing",
    korean: "테스트",
    start: 55,
    end: 60,
  };
  const res2 = validateSentence(outOfBounds, 0, 52);
  assert.equal(res2.valid, false);

  // Inverted times
  const inverted: Partial<Sentence> = {
    speaker: "Harry",
    text: "Testing",
    korean: "테스트",
    start: 10,
    end: 8,
  };
  const res3 = validateSentence(inverted, 0, 52);
  assert.equal(res3.valid, false);

  // Warning on long sentence
  const longSentence: Partial<Sentence> = {
    speaker: "Percy",
    text: "One two three four five six seven eight nine ten eleven twelve thirteen fourteen",
    korean: "긴 문장",
    start: 10,
    end: 16,
  };
  const res4 = validateSentence(longSentence, 0, 52);
  assert.equal(res4.valid, true);
  assert.equal(res4.warnings.length, 2); // > 4s and > 12 words
});

test('calculateProgressSummary computes counts and needs-practice list', () => {
  const sentences: Sentence[] = [
    { id: 1, speaker: 'A', text: 'T1', korean: 'K1', stress: [], start: 0, end: 1 },
    { id: 2, speaker: 'B', text: 'T2', korean: 'K2', stress: [], start: 1, end: 2 },
    { id: 3, speaker: 'C', text: 'T3', korean: 'K3', stress: [], start: 2, end: 3 },
  ];

  const progressMap: Record<number, SentenceProgress> = {
    1: { id: 1, plays: 4, recordings: 2, selfCheck: ['good', 'good', 'good'], status: 'done' },
    2: { id: 2, plays: 2, recordings: 1, selfCheck: ['fair', 'need_practice', 'good'], status: 'practiced' },
    3: { id: 3, plays: 0, recordings: 0, selfCheck: [null, null, null], status: 'new' },
  };

  const summary = calculateProgressSummary(sentences, progressMap);
  assert.equal(summary.completedCount, 1);
  assert.equal(summary.practicedCount, 1);
  assert.equal(summary.totalRecordings, 3);
  assert.deepEqual(summary.needsPracticeIds, [2]);
});
