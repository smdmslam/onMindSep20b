import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Tag, ChevronRight, ChevronDown, Trash2, Edit2, Check, PlayCircle } from 'lucide-react';
import type { Entry } from '../lib/firebase-client';
import { updateEntry } from '../lib/firebase-client';
import { toast } from 'react-hot-toast';
import { extractYouTubeVideoId } from '../lib/metadata';

type TagFiltersProps = {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearAll: () => void;
  entries: Entry[];
  selectedCategory: string;
  onDeleteTag?: (tag: string) => void;
  onPlayTagAsPlaylist?: (tag: string, videos: Entry[]) => void;
};

type SortOption = 'a-z' | 'z-a' | 'frequency' | 'recent';
type EditMode = 'none' | 'delete' | 'rename';

export function TagFilters({ 
  tags, 
  selectedTags, 
  onToggleTag, 
  onClearAll,
  entries,
  selectedCategory,
  onDeleteTag,
  onPlayTagAsPlaylist
}: TagFiltersProps) {
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [showAllTags, setShowAllTags] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [isExpanded, setIsExpanded] = useState(true); // Default to expanded
  const [editingTag, setEditingTag] = useState<{ original: string; new: string } | null>(null);

  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTag && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingTag]);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const filteredAndSortedTags = useMemo(() => {
    const categoryEntries = selectedCategory
      ? selectedCategory === 'Favorites'
        ? entries.filter(entry => entry.is_favorite)
        : selectedCategory === 'All'
          ? entries // Show all entries for "All" category
          : entries.filter(entry => entry.category === selectedCategory)
      : []; // Show no entries (and thus no tags) when no category selected

    const tagFrequency = new Map<string, number>();
    categoryEntries.forEach(entry => {
      entry.tags.forEach(tag => {
        tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
      });
    });

    const categoryTags = Array.from(new Set(categoryEntries.flatMap(entry => entry.tags)));
    
    return categoryTags.sort((a, b) => {
      switch (sortBy) {
        case 'a-z':
          return a.toLowerCase().localeCompare(b.toLowerCase());
        case 'z-a':
          return b.toLowerCase().localeCompare(a.toLowerCase());
        case 'frequency':
          const freqA = tagFrequency.get(a) || 0;
          const freqB = tagFrequency.get(b) || 0;
          return freqB - freqA || a.toLowerCase().localeCompare(b.toLowerCase());
        case 'recent':
          const latestA = categoryEntries
            .filter(entry => entry.tags.includes(a))
            .sort((e1, e2) => new Date(e2.created_at).getTime() - new Date(e1.created_at).getTime())[0];
          const latestB = categoryEntries
            .filter(entry => entry.tags.includes(b))
            .sort((e1, e2) => new Date(e2.created_at).getTime() - new Date(e1.created_at).getTime())[0];
          return new Date(latestB?.created_at || 0).getTime() - new Date(latestA?.created_at || 0).getTime();
        default:
          return 0;
      }
    });
  }, [entries, selectedCategory, sortBy]);

  const visibleTags = useMemo(() => {
    if (showAllTags) return filteredAndSortedTags;
    const limit = isMobile ? 10 : 15; // Show 15 on desktop, 10 on mobile
    return filteredAndSortedTags.slice(0, limit);
  }, [filteredAndSortedTags, showAllTags, isMobile]);

  const hasMoreTags = filteredAndSortedTags.length > visibleTags.length;

  // Get YouTube video count for each tag
  const tagYouTubeCount = useMemo(() => {
    const counts = new Map<string, number>();
    
    filteredAndSortedTags.forEach(tag => {
      const tagEntries = entries.filter(entry => entry.tags.includes(tag));
      const youtubeVideos = tagEntries.filter(entry => 
        entry.url && extractYouTubeVideoId(entry.url)
      );
      counts.set(tag, youtubeVideos.length);
    });
    
    return counts;
  }, [entries, filteredAndSortedTags]);

  const handlePlayTagAsPlaylist = (tag: string) => {
    if (!onPlayTagAsPlaylist) return;
    
    const tagEntries = entries.filter(entry => entry.tags.includes(tag));
    const youtubeVideos = tagEntries.filter(entry => 
      entry.url && extractYouTubeVideoId(entry.url)
    );
    
    if (youtubeVideos.length === 0) {
      toast.error('No YouTube videos found in this tag');
      return;
    }
    
    onPlayTagAsPlaylist(tag, youtubeVideos);
  };

  const handleDeleteTag = (tag: string) => {
    setTagToDelete(tag);
  };

  const confirmDeleteTag = () => {
    if (tagToDelete && onDeleteTag) {
      onDeleteTag(tagToDelete);
      setTagToDelete(null);
    }
  };

  const handleStartRename = (tag: string) => {
    setEditingTag({ original: tag, new: tag });
  };

  const handleRenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingTag) {
      setEditingTag({ ...editingTag, new: e.target.value });
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTag || editingTag.original === editingTag.new || !editingTag.new.trim()) {
      setEditingTag(null);
      return;
    }

    try {
      // Update all entries that have this tag
      const entriesToUpdate = entries.filter(entry => entry.tags.includes(editingTag.original));
      
      for (const entry of entriesToUpdate) {
        const updatedTags = entry.tags.map(tag => 
          tag === editingTag.original ? editingTag.new : tag
        );
        
        const { error } = await updateEntry(entry.id, { tags: updatedTags });
        
        if (error) throw error;
      }
      
      toast.success(`Tag "${editingTag.original}" renamed to "${editingTag.new}"`);
      
      // Update selected tags if the renamed tag was selected
      if (selectedTags.includes(editingTag.original)) {
        const updatedSelectedTags = selectedTags.map(tag =>
          tag === editingTag.original ? editingTag.new : tag
        );
        onToggleTag(editingTag.original); // Deselect old tag
        onToggleTag(editingTag.new); // Select new tag
      }
      
      setEditingTag(null);
      
    } catch (error) {
      console.error('Error renaming tag:', error);
      toast.error('Failed to rename tag');
    }
  };

  const toggleEditMode = (mode: EditMode) => {
    setEditMode(mode === editMode ? 'none' : mode);
    setEditingTag(null);
  };

  if (filteredAndSortedTags.length === 0) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-white/60" />
          <span className="text-sm text-white/60">
            Tags {selectedTags.length > 0 && `(${selectedTags.length} selected)`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-white/60" />
        ) : (
          <ChevronRight size={16} className="text-white/60" />
        )}
      </button>

      <div className={`space-y-3 overflow-hidden transition-all duration-300 ${
        isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="flex items-center justify-between">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-transparent text-sm text-white/60 focus:outline-none hover:text-white transition-colors cursor-pointer"
          >
            <option value="a-z">Sort A-Z</option>
            <option value="z-a">Sort Z-A</option>
            <option value="frequency">Sort by Frequency</option>
            <option value="recent">Sort by Recent</option>
          </select>
          <div className="flex items-center gap-2">
            {onDeleteTag && (
              <>
                <button
                  onClick={() => toggleEditMode('rename')}
                  className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                    editMode === 'rename'
                      ? 'bg-[#2d9edb] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Edit2 size={12} />
                  {editMode === 'rename' ? 'Exit Rename' : 'Rename Tags'}
                </button>
                <button
                  onClick={() => toggleEditMode('delete')}
                  className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                    editMode === 'delete'
                      ? 'bg-red-500 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Trash2 size={12} />
                  {editMode === 'delete' ? 'Exit Delete' : 'Delete Tags'}
                </button>
              </>
            )}
            {selectedTags.length > 0 && (
              <button
                onClick={onClearAll}
                className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center gap-1"
              >
                <X size={12} />
                Clear all filters
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <div 
            ref={tagsContainerRef}
            className={`flex flex-wrap items-center gap-2 ${!showAllTags && hasMoreTags ? 'pb-2' : ''}`}
            style={{
              maxHeight: showAllTags ? 'none' : isMobile ? '160px' : '200px',
              overflowY: showAllTags || !hasMoreTags ? 'visible' : 'hidden'
            }}
          >
            {visibleTags.map((tag) => (
              <div key={tag} className="flex items-center gap-1">
                {editingTag?.original === tag ? (
                  <form onSubmit={handleRenameSubmit} className="flex items-center">
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingTag.new}
                      onChange={handleRenameChange}
                      className="px-2 py-1 text-xs bg-black/30 border border-[#2d9edb] rounded-l-full text-white focus:outline-none w-32"
                    />
                    <button
                      type="submit"
                      className="p-1 bg-[#2d9edb] text-white rounded-r-full hover:bg-[#2d9edb]/90 transition-colors"
                    >
                      <Check size={12} />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onToggleTag(tag)}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-[#2d9edb] text-white'
                          : 'bg-[#2d9edb]/20 text-[#2d9edb] hover:bg-[#2d9edb]/30'
                      }`}
                    >
                      {tag}
                      {tagYouTubeCount.get(tag) ? (
                        <span className="ml-1 text-xs opacity-80">
                          ({tagYouTubeCount.get(tag)} videos)
                        </span>
                      ) : null}
                    </button>
                    {tagYouTubeCount.get(tag) ? (
                      <button
                        onClick={() => handlePlayTagAsPlaylist(tag)}
                        className="p-1 text-[#2d9edb] hover:text-[#2d9edb]/80 hover:bg-[#2d9edb]/20 rounded-full transition-colors"
                        title={`Play ${tagYouTubeCount.get(tag)} videos as playlist`}
                      >
                        <PlayCircle size={12} />
                      </button>
                    ) : null}
                    {editMode === 'delete' && onDeleteTag && (
                      <button
                        onClick={() => handleDeleteTag(tag)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-colors"
                        title="Delete tag"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    {editMode === 'rename' && (
                      <button
                        onClick={() => handleStartRename(tag)}
                        className="p-1 text-[#2d9edb] hover:text-[#2d9edb]/80 hover:bg-[#2d9edb]/20 rounded-full transition-colors"
                        title="Rename tag"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {hasMoreTags && (
            <div className="sticky bottom-0 pt-2 bg-gradient-to-br from-[#2d1b69] to-[#1a1a1a]">
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="w-full flex items-center justify-center gap-1 text-xs text-[#2d9edb] hover:text-[#2d9edb]/80 transition-colors bg-[#1a1a1a]/50 backdrop-blur-sm py-1 rounded-lg"
              >
                {showAllTags ? 'Show less' : `Show all (${filteredAndSortedTags.length})`}
                <ChevronRight size={14} className={`transition-transform ${showAllTags ? 'rotate-90' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Tag Deletion */}
      {tagToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gradient-to-br from-[#2d1b69]/90 to-[#1a1a1a] border border-white/20 rounded-xl p-4 max-w-md w-full shadow-xl backdrop-blur-sm">
            <h3 className="text-base font-semibold text-white mb-2">Delete Tag</h3>
            <p className="text-sm text-white/80 mb-4">
              Are you sure you want to delete the tag "{tagToDelete}"? This will remove it from all entries.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setTagToDelete(null)}
                className="px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTag}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Delete Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}