import React from 'react';
import { Star, Pin, Pencil, Trash2, ChevronDown, ChevronUp, ExternalLink, Clock, Youtube } from 'lucide-react';
import type { Entry } from '../lib/firebase-client';
import { formatDate, formatTextWithLinks } from '../lib/utils';
import { extractYouTubeVideoId } from '../lib/metadata';

type EntryRowProps = {
  entry: Entry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onPlayVideo: (entry: Entry) => void;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
};

export function EntryRow({
  entry,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleFavorite,
  onTogglePin,
  onPlayVideo,
  onTagClick,
  onCategoryClick,
}: EntryRowProps) {
  const isYouTubeUrl = entry.url ? !!extractYouTubeVideoId(entry.url) : false;

  return (
    <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-xl overflow-hidden transition-all duration-300">
      <div className="p-4">
        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-white truncate flex-1 mr-2">{entry.title}</h3>
            <button
              onClick={onToggleExpand}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 text-sm text-white/40">
              <Clock size={14} />
              <span>{formatDate(entry.created_at)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onToggleFavorite(entry.id, !entry.is_favorite)}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                  entry.is_favorite ? 'text-yellow-400' : 'text-white/60'
                }`}
              >
                <Star size={18} />
              </button>
              <button
                onClick={() => onTogglePin(entry.id, !entry.is_pinned)}
                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                  entry.is_pinned ? 'text-[#2d9edb]' : 'text-white/60'
                }`}
              >
                <Pin size={18} />
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEdit(entry)}
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => onDelete(entry.id)}
                className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:grid sm:grid-cols-[1fr,auto,auto,auto] sm:gap-4 sm:items-center">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{entry.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-sm text-white/40">
                <Clock size={14} />
                <span>{formatDate(entry.created_at)}</span>
              </div>
              <button
                onClick={() => onCategoryClick?.(entry.category)}
                className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/90 hover:bg-white/20 transition-colors"
              >
                {entry.category}
              </button>
              {entry.tags.slice(0, 2).map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick?.(tag)}
                  className="px-2 py-0.5 bg-[#2d9edb]/20 text-[#2d9edb] rounded-full text-xs hover:bg-[#2d9edb]/30 transition-colors"
                >
                  {tag}
                </button>
              ))}
              {entry.tags.length > 2 && (
                <span className="text-xs text-white/60">
                  +{entry.tags.length - 2} more
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleFavorite(entry.id, !entry.is_favorite)}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                entry.is_favorite ? 'text-yellow-400' : 'text-white/60'
              }`}
            >
              <Star size={18} />
            </button>
            <button
              onClick={() => onTogglePin(entry.id, !entry.is_pinned)}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                entry.is_pinned ? 'text-[#2d9edb]' : 'text-white/60'
              }`}
            >
              <Pin size={18} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

          <button
            onClick={onToggleExpand}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10">
          <div className="mt-4">
            <div className="text-sm font-medium text-white/60 mb-1">Content:</div>
            <pre className="bg-black/30 rounded-lg p-3 font-mono text-sm text-white/90 overflow-x-auto whitespace-pre-wrap">{entry.content}</pre>
          </div>

          {entry.url && (
            <div>
              <div className="text-sm font-medium text-white/60 mb-1">URL:</div>
              <div className="flex items-center gap-2">
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#2d9edb] hover:text-[#2d9edb]/80 transition-colors"
                >
                  {entry.url} <ExternalLink size={14} />
                </a>
                {isYouTubeUrl && (
                  <button
                    onClick={() => onPlayVideo(entry)}
                    className="p-1.5 text-[#2d9edb] hover:text-[#2d9edb]/80 hover:bg-[#2d9edb]/10 rounded-lg transition-colors youtube-watch-button"
                    title="Watch video"
                  >
                    <Youtube size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {entry.explanation && (
            <div>
              <div className="text-sm font-medium text-white/60 mb-1">Explanation:</div>
              <div className="text-white/90">{formatTextWithLinks(entry.explanation)}</div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onCategoryClick?.(entry.category)}
              className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/90 hover:bg-white/20 transition-colors"
            >
              {entry.category}
            </button>
            {entry.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick?.(tag)}
                className="px-3 py-1 bg-[#2d9edb]/20 text-[#2d9edb] rounded-full text-sm hover:bg-[#2d9edb]/30 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}