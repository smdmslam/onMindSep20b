import React from 'react';
import { Star, Pin, ExternalLink, Clock, Youtube, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
import type { Entry } from '../lib/supabase';
import { formatDate, formatTextWithLinks } from '../lib/utils';
import { extractYouTubeVideoId } from '../lib/metadata';

type EntryLineProps = {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onShowDetails: (entry: Entry) => void;
  onPlayVideo: (entry: Entry) => void;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
};

export function EntryLine({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
  onTogglePin,
  onShowDetails,
  onPlayVideo,
  onTagClick,
  onCategoryClick,
}: EntryLineProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isYouTubeUrl = entry.url ? !!extractYouTubeVideoId(entry.url) : false;

  return (
    <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-lg overflow-hidden transition-all duration-300">
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="group px-4 py-2 hover:bg-[#1a1a1a]/70 transition-colors cursor-pointer"
      >
        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-medium text-white truncate max-w-[200px]">{entry.title}</h3>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {isYouTubeUrl && (
                <Youtube size={14} className="text-[#2d9edb]" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(entry.id, !entry.is_favorite);
                }}
                className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${
                  entry.is_favorite ? 'text-yellow-400' : 'text-white/30'
                }`}
              >
                <Star size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(entry.id, !entry.is_pinned);
                }}
                className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${
                  entry.is_pinned ? 'text-[#2d9edb]' : 'text-white/30'
                }`}
              >
                <Pin size={14} />
              </button>
              <span className="text-xs text-white/40">{formatDate(entry.created_at)}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCategoryClick?.(entry.category);
              }}
              className="px-2 py-0.5 bg-white/10 rounded-full text-xs text-white/90 hover:bg-white/20 transition-colors"
            >
              {entry.category}
            </button>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:grid sm:grid-cols-[auto,1fr,auto] sm:gap-4 sm:items-center">
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(entry.id, !entry.is_favorite);
              }}
              className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${
                entry.is_favorite ? 'text-yellow-400' : 'text-white/30 group-hover:text-white/60'
              }`}
            >
              <Star size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(entry.id, !entry.is_pinned);
              }}
              className={`p-1 rounded-lg hover:bg-white/10 transition-colors ${
                entry.is_pinned ? 'text-[#2d9edb]' : 'text-white/30 group-hover:text-white/60'
              }`}
            >
              <Pin size={16} />
            </button>
          </div>

          <div className="flex items-center gap-4 min-w-0">
            <h3 className="text-sm font-medium text-white truncate max-w-[400px]">{entry.title}</h3>
            
            <div className="flex items-center gap-3 text-xs shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryClick?.(entry.category);
                }}
                className="px-2 py-0.5 bg-white/10 rounded-full text-white/90 hover:bg-white/20 transition-colors"
              >
                {entry.category}
              </button>
              {entry.tags.length > 0 && (
                <span className="text-white/40">
                  {entry.tags.length} tag{entry.tags.length !== 1 ? 's' : ''}
                </span>
              )}
              {entry.url && (
                <span className="text-[#2d9edb]">
                  {isYouTubeUrl ? <Youtube size={14} /> : <ExternalLink size={14} />}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 text-xs text-white/40">
              <Clock size={14} />
              <span>{formatDate(entry.created_at)}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="p-1 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
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
            {entry.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick?.(tag);
                }}
                className="px-3 py-1 bg-[#2d9edb]/20 text-[#2d9edb] rounded-full text-sm hover:bg-[#2d9edb]/30 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => onEdit(entry)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}