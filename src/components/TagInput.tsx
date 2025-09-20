import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

type TagInputProps = {
  value: string[] | string;
  onChange: (value: string[] | string) => void;
  existingTags: string[];
};

export function TagInput({ value, onChange, existingTags }: TagInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert value to array if it's a string
  const currentTags = Array.isArray(value) ? value : value.split(',').map(tag => tag.trim()).filter(Boolean);

  useEffect(() => {
    if (inputValue) {
      const filtered = existingTags
        .filter(tag => 
          tag.toLowerCase().includes(inputValue.toLowerCase()) && 
          !currentTags.includes(tag)
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, existingTags, currentTags]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions.length > 0) {
        // Add selected suggestion
        const selectedTag = suggestions[selectedIndex];
        if (!currentTags.includes(selectedTag)) {
          const newTags = [...currentTags, selectedTag];
          onChange(newTags);
        }
      } else {
        // Add new tag from input
        const newTag = inputValue.trim();
        if (!currentTags.includes(newTag)) {
          const newTags = [...currentTags, newTag];
          onChange(newTags);
        }
      }
      setInputValue('');
      setSuggestions([]);
    } else if (e.key === 'Backspace' && !inputValue) {
      // Remove last tag when backspace is pressed and input is empty
      e.preventDefault();
      const newTags = currentTags.slice(0, -1);
      onChange(newTags);
    } else if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
      } else if (e.key === 'Escape') {
        setSuggestions([]);
      }
    }
  };

  const handleSuggestionClick = (tag: string) => {
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag];
      onChange(newTags);
    }
    setInputValue('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    onChange(newTags);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 bg-black/30 border border-white/10 rounded-lg min-h-[42px]">
        {currentTags.map((tag) => (
          <div
            key={tag}
            className="flex items-center gap-1 px-2 py-1 bg-[#2d9edb]/20 text-[#2d9edb] rounded-lg text-sm"
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0.5 hover:bg-[#2d9edb]/20 rounded transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[120px] bg-transparent text-white placeholder-white/40 focus:outline-none"
          placeholder={currentTags.length === 0 ? "Add tags..." : ""}
        />
      </div>
      
      {suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg overflow-hidden">
          {suggestions.map((tag, index) => (
            <button
              key={tag}
              onClick={() => handleSuggestionClick(tag)}
              className={`w-full px-4 py-2 text-left hover:bg-white/10 transition-colors ${
                index === selectedIndex ? 'bg-white/10' : ''
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}