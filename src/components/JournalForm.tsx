import React, { useState, useEffect } from 'react';
import { X, Star, Pin, Tag, RefreshCw, SmilePlus, Smile, Meh, Frown, Frown as FrownPlus } from 'lucide-react';
import type { Entry } from '../lib/firebase-client';
import { TagInput } from './TagInput';
import { Timestamp } from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '../lib/constants';

type Mood = 'joyful' | 'calm' | 'anxious' | 'sad' | 'angry';

type JournalFormProps = {
  onSubmit: (data: Partial<Entry>) => void;
  onCancel: () => void;
  existingCategories: string[];
  existingTags: string[];
  entry?: Entry;
};

export function JournalForm({ onSubmit, onCancel, existingCategories, existingTags, entry }: JournalFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    explanation: '',
    tags: 'Journal',
    is_favorite: false,
    is_pinned: false,
    mood: '' as Mood,
    customDate: new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDThh:mm
  });
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);

  // Combine default and custom categories
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();

  // Journal prompts to inspire writing
  const journalPrompts = [
    "What's the most meaningful thing that happened today?",
    "What are you grateful for right now?",
    "What's something you learned today?",
    "What's a challenge you faced and how did you handle it?",
    "What are your goals for tomorrow?",
    "How are you feeling and why?",
    "What's something you're looking forward to?",
    "What's a memory from today you want to remember?",
    "What gave you energy today?",
    "Did anything surprise you today?",
  ];

  // Initialize form data from entry when editing
  useEffect(() => {
    if (entry) {
      // Extract mood from content if present
      const moodMatch = entry.content.match(/^Mood: (.*?)\n---\n/);
      const mood = moodMatch ? moodMatch[1] as Mood : '';
      const content = entry.content.replace(/^Mood: .*\n---\n/, '');

      // Get all tags except mood tags and Journal tag
      const tags = entry.tags
        .filter(tag => !tag.startsWith('mood:') && tag !== 'Journal')
        .join(', ');

      // If there's no comma-separated tags, just use 'Journal'
      const finalTags = tags || 'Journal';

      // Convert Firebase Timestamp to Date
      const entryDate = entry.created_at instanceof Timestamp 
        ? entry.created_at.toDate() 
        : new Date(entry.created_at);

      setFormData({
        title: entry.title,
        content,
        category: entry.category,
        explanation: entry.explanation || '',
        tags: finalTags,
        is_favorite: entry.is_favorite,
        is_pinned: entry.is_pinned,
        mood,
        customDate: entryDate.toISOString().slice(0, 16)
      });
      
      // Show advanced fields if entry has non-default category or explanation
      if (entry.category !== 'Journal' || entry.explanation) {
        setShowAdvancedFields(true);
      }
    }

    // Get random prompt
    const randomIndex = Math.floor(Math.random() * journalPrompts.length);
    setCurrentPrompt(journalPrompts[randomIndex]);
  }, [entry]);

  // Using Lucide face icons for moods with updated colors
  const moodIcons = {
    joyful: <SmilePlus size={16} className="text-[#FFD93D]" />, // Warm Yellow
    calm: <Smile size={16} className="text-[#6DD3CE]" />, // Soft Teal
    anxious: <Meh size={16} className="text-[#F4A261]" />, // Muted Orange
    sad: <Frown size={16} className="text-[#4A4E69]" />, // Cool Blue
    angry: <FrownPlus size={16} className="text-[#D7263D]" /> // Deep Red
  };

  const moodLabels = {
    joyful: 'Joyful - Energetic, happy, optimistic',
    calm: 'Calm - Peaceful, grounded, relaxed',
    anxious: 'Anxious - Uneasy, alert, unsettled',
    sad: 'Sad - Reflective, melancholy',
    angry: 'Angry - Intense, passionate, frustrated'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get tags array, ensure 'Journal' is included
    const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    if (!tags.includes('Journal')) {
      tags.unshift('Journal');
    }

    // Add mood as tag if selected
    if (formData.mood) {
      const moodTag = `mood:${formData.mood}`;
      if (!tags.includes(moodTag)) {
        tags.push(moodTag);
      }
    }
    
    // Format metadata as part of the content
    const metadata = formData.mood ? `Mood: ${formData.mood}` : '';
    
    const fullContent = [
      metadata,
      metadata ? '\n---\n' : '',
      formData.content
    ].join('');
    
    onSubmit({
      title: formData.title || new Date(formData.customDate).toLocaleDateString(),
      content: fullContent || ' ',
      category: formData.category,
      explanation: formData.explanation || null,
      tags: tags,
      is_favorite: formData.is_favorite,
      is_pinned: formData.is_pinned,
      created_at: new Date(formData.customDate).toISOString()
    });
  };

  const getNewPrompt = () => {
    let newPrompt = currentPrompt;
    while (newPrompt === currentPrompt) {
      const randomIndex = Math.floor(Math.random() * journalPrompts.length);
      newPrompt = journalPrompts[randomIndex];
    }
    setCurrentPrompt(newPrompt);
  };

  const usePrompt = () => {
    if (currentPrompt) {
      setFormData(prev => ({
        ...prev,
        content: prev.content + (prev.content ? '\n\n' : '') + `${currentPrompt}\n`
      }));
      getNewPrompt();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a]/50 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-white">
            {entry ? 'Edit Journal Entry' : 'Journal Entry'}
          </h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_favorite: !prev.is_favorite }))}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                formData.is_favorite ? 'text-yellow-400' : 'text-white/60'
              }`}
            >
              <Star size={18} />
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_pinned: !prev.is_pinned }))}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                formData.is_pinned ? 'text-[#2d9edb]' : 'text-white/60'
              }`}
            >
              <Pin size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowAdvancedFields(!showAdvancedFields)}
            className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={showAdvancedFields ? "Hide advanced fields" : "Show advanced fields"}
          >
            {showAdvancedFields ? 'Show Less' : 'Show More'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-white/60 mb-2">
          Track your mood to unlock insights - See your 10-day emotional journey in Settings
        </label>
        <div className="flex flex-wrap gap-2">
          {(['joyful', 'calm', 'anxious', 'sad', 'angry'] as Mood[]).map(mood => (
            <button
              key={mood}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, mood }))}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                formData.mood === mood
                  ? `bg-${mood === 'joyful' ? '[#FFD93D]' : 
                      mood === 'calm' ? '[#6DD3CE]' : 
                      mood === 'anxious' ? '[#F4A261]' : 
                      mood === 'sad' ? '[#4A4E69]' : 
                      '[#D7263D]'}/20 ring-2 ring-${
                      mood === 'joyful' ? '[#FFD93D]' : 
                      mood === 'calm' ? '[#6DD3CE]' : 
                      mood === 'anxious' ? '[#F4A261]' : 
                      mood === 'sad' ? '[#4A4E69]' : 
                      '[#D7263D]'}/40`
                  : 'bg-black/30 text-white/60 hover:bg-white/10'
              }`}
              title={moodLabels[mood]}
            >
              {moodIcons[mood]}
              <span className="text-xs">{mood.charAt(0).toUpperCase() + mood.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
          placeholder="Title (optional, will use date if empty)"
        />
      </div>

      {/* Writing Prompt */}
      {currentPrompt && (
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2 p-3 bg-[#2d9edb]/10 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#2d9edb] mb-1">
                Writing Prompt
              </label>
              <p className="text-sm text-white/90">{currentPrompt}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={getNewPrompt}
                className="p-2 text-[#2d9edb] hover:bg-[#2d9edb]/20 rounded-lg transition-colors"
                title="Get another prompt"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={usePrompt}
                className="px-3 py-1.5 text-sm bg-[#2d9edb]/20 text-[#2d9edb] rounded-lg hover:bg-[#2d9edb]/30 transition-colors"
              >
                Use Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50 resize-none"
          placeholder="Write your journal entry here..."
          rows={12}
          style={{ minHeight: '300px' }}
        />
        <div className="flex justify-end mt-2">
          <input
            type="datetime-local"
            value={formData.customDate}
            onChange={(e) => setFormData(prev => ({ ...prev, customDate: e.target.value }))}
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/60 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
          />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Tag size={16} className="text-white/60" />
          <label className="text-sm font-medium text-white/60">
            Tags
          </label>
        </div>
        <TagInput
          value={formData.tags}
          onChange={(value) => setFormData(prev => ({ ...prev, tags: value }))}
          existingTags={existingTags}
        />
        <p className="mt-1 text-xs text-white/40">
          Tags (optional, comma-separated). "Journal" tag will be automatically added.
        </p>
      </div>

      {/* Advanced Fields - Category and Explanation */}
      {showAdvancedFields && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-white/60 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
            >
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-white/60 mb-1">
              Explanation (optional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50 resize-none"
              placeholder="Additional explanation or notes"
              rows={2}
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-[#2d9edb] text-white rounded-lg hover:bg-[#2d9edb]/90 transition-colors"
        >
          {entry ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>
    </form>
  );
}