import React from 'react';
import type { Entry } from '../lib/supabase';
import { EntryCard } from './EntryCard';
import { EntryRow } from './EntryRow';
import { EntryLine } from './EntryLine';

type ViewMode = 'card' | 'row' | 'line';

type EntryListProps = {
  entries: Entry[];
  loading: boolean;
  showAllEntries: boolean;
  viewMode: ViewMode;
  expandedRows: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (entry: Entry) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
  onShowDetails: (entry: Entry) => void;
  onPlayVideo: (entry: Entry) => void;
  onTagClick: (tag: string) => void;
  onCategoryClick: (category: string) => void;
};

export function EntryList({
  entries,
  loading,
  showAllEntries,
  viewMode,
  expandedRows,
  onToggleExpand,
  onEdit,
  onDelete,
  onToggleFavorite,
  onTogglePin,
  onShowDetails,
  onPlayVideo,
  onTagClick,
  onCategoryClick,
}: EntryListProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#2d9edb] border-t-transparent mx-auto"></div>
        <p className="mt-4 text-white/60">Loading entries...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">
          {showAllEntries ? 'No entries found.' : 'Click "Show All" to view entries.'}
        </p>
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onTogglePin={onTogglePin}
            onPlayVideo={onPlayVideo}
            onTagClick={onTagClick}
            onCategoryClick={onCategoryClick}
          />
        ))}
      </div>
    );
  }

  if (viewMode === 'row') {
    return (
      <div className="space-y-4">
        {entries.map((entry) => (
          <EntryRow
            key={entry.id}
            entry={entry}
            isExpanded={expandedRows.has(entry.id)}
            onToggleExpand={() => onToggleExpand(entry.id)}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleFavorite={onToggleFavorite}
            onTogglePin={onTogglePin}
            onPlayVideo={onPlayVideo}
            onTagClick={onTagClick}
            onCategoryClick={onCategoryClick}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <EntryLine
          key={entry.id}
          entry={entry}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
          onTogglePin={onTogglePin}
          onShowDetails={onShowDetails}
          onPlayVideo={onPlayVideo}
          onTagClick={onTagClick}
          onCategoryClick={onCategoryClick}
        />
      ))}
    </div>
  );
}