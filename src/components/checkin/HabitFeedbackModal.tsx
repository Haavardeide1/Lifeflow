'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus } from 'lucide-react';
import { SliderInput } from '@/components/shared/SliderInput';
import type { HabitFeedback } from '@/types';

const EMOTIONAL_TAGS = [
  'Energized',
  'Proud',
  'Calm',
  'Focused',
  'Neutral',
  'Drained',
  'Stressed',
];

interface HabitFeedbackModalProps {
  habitName: string;
  onSave: (feedback: HabitFeedback) => void;
  onSkip: () => void;
  onClose: () => void;
}

export function HabitFeedbackModal({
  habitName,
  onSave,
  onSkip,
  onClose,
}: HabitFeedbackModalProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [energy, setEnergy] = useState(5);
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState('');
  const [customTag, setCustomTag] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [visible, setVisible] = useState(false);

  // Trigger slide-up animation on mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const animateOut = useCallback((cb: () => void) => {
    setVisible(false);
    setTimeout(cb, 250);
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setCustomTag('');
    setShowCustomInput(false);
  };

  const handleSave = () => {
    if (selectedTags.length === 0) return;
    animateOut(() =>
      onSave({
        completed: true,
        emotionalTags: selectedTags,
        energy,
        mood,
        note: note.trim() || undefined,
      })
    );
  };

  const handleSkip = () => animateOut(onSkip);
  const handleClose = () => animateOut(onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-lg bg-white dark:bg-[#1a1a2e] rounded-t-2xl transition-transform duration-250 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-[16px] font-semibold text-gray-900 dark:text-white">
            How did <span className="text-emerald-400">{habitName}</span> feel?
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* Emotional Tags */}
          <div>
            <label className="text-[13px] font-medium text-gray-600 dark:text-white/70 mb-2 block">
              Emotional Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOTIONAL_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-white/50 border border-transparent hover:border-gray-300 dark:hover:border-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {/* Custom tags already added */}
              {selectedTags
                .filter((t) => !EMOTIONAL_TAGS.includes(t))
                .map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              {/* Add custom tag */}
              {showCustomInput ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addCustomTag();
                      if (e.key === 'Escape') { setShowCustomInput(false); setCustomTag(''); }
                    }}
                    onBlur={addCustomTag}
                    placeholder="Custom..."
                    className="px-3 py-1.5 rounded-full text-[13px] bg-gray-100 dark:bg-white/[0.06] text-gray-700 dark:text-white/80 border border-gray-300 dark:border-white/10 outline-none w-24"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  className="px-3 py-1.5 rounded-full text-[13px] font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-white/30 border border-dashed border-gray-300 dark:border-white/10 hover:border-gray-400 dark:hover:border-white/20 transition-colors flex items-center gap-1"
                >
                  <Plus size={14} />
                  Custom
                </button>
              )}
            </div>
          </div>

          {/* Energy Slider */}
          <SliderInput
            label="Energy"
            value={energy}
            onChange={setEnergy}
            leftEmoji="low"
            rightEmoji="high"
            color="#f97316"
          />

          {/* Mood Slider */}
          <SliderInput
            label="Mood"
            value={mood}
            onChange={setMood}
            leftEmoji=":("
            rightEmoji=":)"
            color="#3b82f6"
          />

          {/* Note */}
          <div>
            <label className="text-[13px] font-medium text-gray-600 dark:text-white/70 mb-1.5 block">
              Note
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything you noticed?"
              className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-[14px] text-gray-700 dark:text-white/80 placeholder:text-gray-300 dark:placeholder:text-white/20 outline-none border border-transparent focus:border-gray-300 dark:focus:border-white/10 transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-200 dark:border-white/[0.06]">
          <button
            onClick={handleSkip}
            className="flex-1 py-2.5 rounded-xl text-[14px] font-medium text-gray-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={selectedTags.length === 0}
            className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Save Feeling
          </button>
        </div>
      </div>
    </div>
  );
}
