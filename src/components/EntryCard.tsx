import React from 'react';
import { Star, Pin, Pencil, Trash2, ChevronDown, ChevronUp, ExternalLink, Clock, Youtube } from 'lucide-react';
import type { Entry } from '../lib/firebase-client';
import { formatDate, formatTextWithLinks } from '../lib/utils';
import { extractYouTubeVideoId } from '../lib/metadata';

type EntryCardProps = {
  entry: Entry;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onPlayVideo: (entry: Entry) => void;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
};

export function EntryCard({
  entry,
  onEdit,
  onDelete,
  onToggleFavorite,
  onTogglePin,
  onPlayVideo,
  onTagClick,
  onCategoryClick,
}: EntryCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isYouTubeUrl = entry.url ? !!extractYouTubeVideoId(entry.url) : false;

  return (
    <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-xl p-6 transition-all duration-300">
      <div className="space-y-2">
        <div className="flex justify-between items-start gap-3">
          <h3 className="text-xl font-semibold text-white line-clamp-2 flex-1">{entry.title}</h3>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onToggleFavorite(entry.id, !entry.is_favorite)}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                entry.is_favorite ? 'text-yellow-400' : 'text-white/60'
              }`}
            >
              <Star size={20} />
            </button>
            <button
              onClick={() => onTogglePin(entry.id, !entry.is_pinned)}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                entry.is_pinned ? 'text-[#2d9edb]' : 'text-white/60'
              }`}
            >
              <Pin size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-white/40">
          <Clock size={14} />
          <span>{formatDate(entry.created_at)}</span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-1 text-sm text-white/60 hover:text-white hover:bg-white/10 py-1 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp size={16} />
            </>
          ) : (
            <>
              Show More <ChevronDown size={16} />
            </>
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
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