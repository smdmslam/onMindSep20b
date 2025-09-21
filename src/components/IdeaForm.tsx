import React, { useState, useEffect } from 'react';
import { X, Star, Pin } from 'lucide-react';
import type { Entry } from '../lib/firebase-client';
import { TagInput } from './TagInput';
import { DEFAULT_CATEGORIES } from '../lib/constants';

type IdeaFormProps = {
  onSubmit: (data: Partial<Entry>) => void;
  onCancel: () => void;
  existingCategories: string[];
  existingTags: string[];
  entry?: Entry;
};

export function IdeaForm({ onSubmit, onCancel, existingCategories, existingTags, entry }: IdeaFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'General',
    explanation: '',
    tags: '',
    is_favorite: false,
    is_pinned: false
  });
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // Combine default and custom categories
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();

  // Initialize form data from entry when editing
  useEffect(() => {
    if (entry) {
      // Get all tags except 'idea' tag
      const tags = entry.tags
        .filter(tag => tag !== 'idea')
        .join(', ');

      setFormData({
        title: entry.title,
        content: entry.content,
        category: entry.category,
        explanation: entry.explanation || '',
        tags: tags || '', // Use empty string if no tags remain after filtering
        is_favorite: entry.is_favorite,
        is_pinned: entry.is_pinned
      });
      
      // Show advanced fields if entry has non-default category or explanation
      if (entry.category !== 'Ideas' || entry.explanation) {
        setShowAdvancedFields(true);
      }
    }
  }, [entry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get tags array, ensure 'idea' is included
    const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    if (!tags.includes('idea')) {
      tags.unshift('idea');
    }
    
    onSubmit({
      title: formData.title,
      content: formData.content || ' ', // Provide a space if content is empty
      category: formData.category,
      explanation: formData.explanation || null,
      tags: tags,
      is_favorite: formData.is_favorite,
      is_pinned: formData.is_pinned
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a]/50 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-white">
            {entry ? 'Edit Idea' : 'Capture Idea'}
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
      
      <div className="mb-3">
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
          placeholder="Title"
          required
        />
      </div>

      <div className="mb-3">
        <textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50 resize-none"
          placeholder="Content"
          rows={3}
        />
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

      <div className="mb-4">
        <TagInput
          value={formData.tags}
          onChange={(value) => setFormData(prev => ({ ...prev, tags: value }))}
          existingTags={existingTags}
        />
        <p className="mt-1 text-xs text-white/40">
          Tags (optional, comma-separated). "idea" tag will be automatically added.
        </p>
      </div>

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
          {entry ? 'Update Idea' : 'Save Idea'}
        </button>
      </div>
    </form>
  );
}