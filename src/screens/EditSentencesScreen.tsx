import React, { useState } from 'react';
import { Sentence } from '../types';
import { MOVIE_INFO, INITIAL_SENTENCES } from '../data/constants';
import { PlayerControls } from '../hooks/useYouTubePlayer';
import { formatTime, parseTime, validateSentence } from '../utils/shadowing';
import {
  ArrowLeft,
  Plus,
  Play,
  Trash2,
  Edit2,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  RotateCcw,
  Clock,
  AlertTriangle,
  Check,
  Save,
  X,
} from 'lucide-react';

interface EditSentencesScreenProps {
  sentences: Sentence[];
  player: PlayerControls;
  onUpdateSentences: (newSentences: Sentence[]) => void;
  onBack: () => void;
}

export const EditSentencesScreen: React.FC<EditSentencesScreenProps> = ({
  sentences,
  player,
  onUpdateSentences,
  onBack,
}) => {
  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [speaker, setSpeaker] = useState('');
  const [text, setText] = useState('');
  const [korean, setKorean] = useState('');
  const [stress, setStress] = useState('');
  const [startTime, setStartTime] = useState<string>('0.0');
  const [endTime, setEndTime] = useState<string>('3.0');

  // Modal / Import / Export
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Form errors / warnings
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [formWarnings, setFormWarnings] = useState<string[]>([]);

  // Open edit for existing sentence
  const handleStartEdit = (s: Sentence) => {
    setEditingId(s.id);
    setSpeaker(s.speaker);
    setText(s.text);
    setKorean(s.korean);
    setStress((s.stress || []).join(', '));
    setStartTime(s.start.toFixed(1));
    setEndTime(s.end.toFixed(1));
    setFormErrors([]);
    setFormWarnings([]);
  };

  // Reset form
  const handleCancelForm = () => {
    setEditingId(null);
    setSpeaker('');
    setText('');
    setKorean('');
    setStress('');
    setStartTime('0.0');
    setEndTime('3.0');
    setFormErrors([]);
    setFormWarnings([]);
  };

  // Set start = now (rounded to 0.1s)
  const handleSetStartNow = () => {
    const cur = player.getCurrentTime();
    setStartTime(cur.toFixed(1));
  };

  // Set end = now (rounded to 0.1s)
  const handleSetEndNow = () => {
    const cur = player.getCurrentTime();
    setEndTime(cur.toFixed(1));
  };

  // Test current segment
  const handleTestSegment = () => {
    const s = parseTime(startTime) ?? 0;
    const e = parseTime(endTime) ?? (s + 2);
    if (e > s) {
      player.playSegment(s, e, false);
    }
  };

  // Save sentence (add or update)
  const handleSaveSentence = (e: React.FormEvent) => {
    e.preventDefault();
    const sNum = parseTime(startTime);
    const eNum = parseTime(endTime);

    const stressList = stress
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

    const validation = validateSentence(
      {
        speaker,
        text,
        korean,
        start: sNum ?? undefined,
        end: eNum ?? undefined,
      },
      MOVIE_INFO.start,
      MOVIE_INFO.end
    );

    if (!validation.valid) {
      setFormErrors(validation.errors);
      setFormWarnings(validation.warnings);
      return;
    }

    setFormErrors([]);
    setFormWarnings(validation.warnings);

    if (editingId !== null) {
      // Update existing
      const updated = sentences.map((s) => {
        if (s.id === editingId) {
          return {
            ...s,
            speaker: speaker.trim(),
            text: text.trim(),
            korean: korean.trim(),
            stress: stressList,
            start: sNum!,
            end: eNum!,
          };
        }
        return s;
      });
      onUpdateSentences(updated);
    } else {
      // Create new
      const nextId = sentences.length > 0 ? Math.max(...sentences.map((s) => s.id)) + 1 : 1;
      const newSentence: Sentence = {
        id: nextId,
        speaker: speaker.trim(),
        text: text.trim(),
        korean: korean.trim(),
        stress: stressList,
        start: sNum!,
        end: eNum!,
      };
      onUpdateSentences([...sentences, newSentence]);
    }

    handleCancelForm();
  };

  // Delete sentence
  const handleDelete = (id: number) => {
    if (confirm("Delete this sentence? / 이 문장을 삭제하시겠습니까?")) {
      const filtered = sentences.filter((s) => s.id !== id);
      onUpdateSentences(filtered);
      if (editingId === id) handleCancelForm();
    }
  };

  // Move sentence up or down
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sentences.length) return;
    const copy = [...sentences];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    onUpdateSentences(copy);
  };

  // Export JSON
  const handleOpenExport = () => {
    setJsonText(JSON.stringify(sentences, null, 2));
    setJsonError(null);
    setCopySuccess(false);
    setShowJsonModal(true);
  };

  // Copy to clipboard
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (e) {
      console.warn("Clipboard copy failed:", e);
    }
  };

  // Import JSON
  const handleApplyImport = () => {
    try {
      setJsonError(null);
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        throw new Error("Imported data must be an array of sentences.");
      }
      // Basic check
      for (const item of parsed) {
        if (!item.text || item.start === undefined || item.end === undefined) {
          throw new Error("Each sentence must have text, start, and end properties.");
        }
      }
      onUpdateSentences(parsed);
      setShowJsonModal(false);
      handleCancelForm();
    } catch (err: any) {
      setJsonError(err.message || "Invalid JSON format.");
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (confirm("Reset to default 9 sentences? / 기본 9개 문장으로 초기화하시겠습니까?")) {
      onUpdateSentences(INITIAL_SENTENCES);
      handleCancelForm();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#150727] text-purple-100 pb-16">
      {/* Header bar */}
      <div className="px-4 py-3 bg-[#1e0b37] border-b border-purple-800/60 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-amber-300 py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back / 돌아가기</span>
        </button>

        <h2 className="text-sm font-bold text-amber-200">
          Edit Sentences / 문장 편집
        </h2>

        <div className="flex items-center gap-1">
          <button
            onClick={handleOpenExport}
            className="p-1.5 rounded-lg text-purple-300 hover:text-amber-300 hover:bg-purple-900/50 transition-colors"
            title="Export / Import JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetToDefault}
            className="p-1.5 rounded-lg text-purple-300 hover:text-amber-300 hover:bg-purple-900/50 transition-colors"
            title="Reset to Default"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Form: Add or Edit Sentence */}
        <div className="bg-[#220c3d] border border-amber-500/30 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-3 border-b border-purple-900/60 pb-2">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
              {editingId !== null ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>
                {editingId !== null
                  ? `Editing Sentence #${sentences.findIndex((s) => s.id === editingId) + 1}`
                  : 'Add New Sentence / 새 문장 추가'}
              </span>
            </h3>
            {editingId !== null && (
              <button
                onClick={handleCancelForm}
                className="text-xs text-purple-400 hover:text-purple-200 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSaveSentence} className="space-y-3">
            {/* Speaker & Stress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs text-purple-300 mb-1 font-medium">
                  Speaker / 화자 *
                </label>
                <input
                  type="text"
                  value={speaker}
                  onChange={(e) => setSpeaker(e.target.value)}
                  placeholder="e.g. Harry Potter"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-purple-950/70 border border-purple-800 focus:border-amber-400 focus:outline-none text-purple-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-purple-300 mb-1 font-medium">
                  Stress Words (comma-separated) / 강조 단어
                </label>
                <input
                  type="text"
                  value={stress}
                  onChange={(e) => setStress(e.target.value)}
                  placeholder="e.g. Muggle, witch"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-purple-950/70 border border-purple-800 focus:border-amber-400 focus:outline-none text-purple-100"
                />
              </div>
            </div>

            {/* English Sentence Text */}
            <div>
              <label className="block text-xs text-purple-300 mb-1 font-medium">
                English Sentence / 영어 문장 *
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type the exact English sentence heard in the clip..."
                rows={2}
                className="w-full text-xs px-3 py-2 rounded-xl bg-purple-950/70 border border-purple-800 focus:border-amber-400 focus:outline-none text-purple-100 resize-none"
                required
              />
            </div>

            {/* Korean Translation */}
            <div>
              <label className="block text-xs text-purple-300 mb-1 font-medium">
                Korean Meaning / 한국어 뜻 *
              </label>
              <input
                type="text"
                value={korean}
                onChange={(e) => setKorean(e.target.value)}
                placeholder="한국어 번역을 입력해주세요..."
                className="w-full text-xs px-3 py-2 rounded-xl bg-purple-950/70 border border-purple-800 focus:border-amber-400 focus:outline-none text-purple-100"
                required
              />
            </div>

            {/* Timestamps: Start / End & Current time auto-fill */}
            <div className="bg-[#19082d] p-3 rounded-xl border border-purple-900/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Timestamps / 구간 설정 (0:00 – 0:52)</span>
                </span>
                <span className="text-purple-400 font-mono text-[11px]">
                  Now: {player.currentTime.toFixed(1)}s
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-purple-300">Start (seconds)</label>
                    <button
                      type="button"
                      onClick={handleSetStartNow}
                      className="text-[10px] text-amber-300 hover:underline bg-purple-900/50 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Set = now ({player.currentTime.toFixed(1)}s)
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min={MOVIE_INFO.start}
                    max={MOVIE_INFO.end}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-purple-950 border border-purple-800 focus:border-amber-400 focus:outline-none text-purple-100 font-mono"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-purple-300">End (seconds)</label>
                    <button
                      type="button"
                      onClick={handleSetEndNow}
                      className="text-[10px] text-amber-300 hover:underline bg-purple-900/50 px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Set = now ({player.currentTime.toFixed(1)}s)
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min={MOVIE_INFO.start}
                    max={MOVIE_INFO.end}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-purple-950 border border-purple-800 focus:border-amber-400 focus:outline-none text-purple-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleTestSegment}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Test Segment / 구간 테스트</span>
                </button>
                <span className="text-[11px] text-purple-400">
                  Duration: {((parseTime(endTime) || 0) - (parseTime(startTime) || 0)).toFixed(1)}s
                </span>
              </div>
            </div>

            {/* Errors / Warnings */}
            {formErrors.length > 0 && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
                {formErrors.map((err, i) => (
                  <p key={i}>• {err}</p>
                ))}
              </div>
            )}
            {formWarnings.length > 0 && (
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 space-y-1">
                {formWarnings.map((warn, i) => (
                  <p key={i} className="flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{warn}</span>
                  </p>
                ))}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full min-h-[48px] py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold text-xs shadow flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{editingId !== null ? 'Save Changes / 변경사항 저장' : 'Add to List / 문장 추가'}</span>
            </button>
          </form>
        </div>

        {/* Existing Sentences List with Reordering & Deletion */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-purple-300">
            <span className="font-semibold text-amber-200">
              Current Sentences ({sentences.length}) / 현재 문장 목록
            </span>
            <span className="text-[11px]">Reorder & manage</span>
          </div>

          {sentences.length === 0 ? (
            <div className="text-center py-8 bg-[#1f0b37]/50 rounded-xl border border-purple-800/40 text-xs text-purple-300">
              No sentences in list.
            </div>
          ) : (
            sentences.map((s, idx) => (
              <div
                key={s.id}
                className="bg-[#200c3a] border border-purple-800/50 rounded-xl p-3 flex items-start justify-between gap-2 shadow-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-extrabold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-purple-200">
                      {s.speaker}
                    </span>
                    <span className="text-[11px] text-purple-400 font-mono">
                      {formatTime(s.start)} – {formatTime(s.end)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-purple-100">{s.text}</p>
                  <p className="text-[11px] text-purple-400/80 mt-0.5">{s.korean}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleMove(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1 text-purple-300 hover:text-amber-300 disabled:opacity-20 cursor-pointer"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMove(idx, 'down')}
                    disabled={idx === sentences.length - 1}
                    className="p-1 text-purple-300 hover:text-amber-300 disabled:opacity-20 cursor-pointer"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleStartEdit(s)}
                    className="p-1 text-purple-300 hover:text-amber-300 cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* JSON Import/Export Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1f0b37] border border-amber-500/40 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-800 pb-2">
              <h3 className="text-sm font-bold text-amber-300">
                Export / Import Sentences JSON
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-purple-400 hover:text-purple-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-purple-300/80">
              Copy the JSON below to back up your sentences, or paste a new JSON array to import.
            </p>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={8}
              className="w-full text-xs font-mono p-3 rounded-xl bg-purple-950 border border-purple-800 focus:outline-none focus:border-amber-400 text-purple-100"
            />

            {jsonError && (
              <p className="text-xs text-rose-300">{jsonError}</p>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyJson}
                className="px-3 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-amber-300 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{copySuccess ? 'Copied! / 복사완료' : 'Copy JSON / 복사'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="px-3 py-2 rounded-xl text-purple-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyImport}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-purple-950 font-bold text-xs"
                >
                  Apply Import / 적용하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
