import React from 'react';
import { Lightbulb, FileText, BookOpen, Eye, Book, Edit } from 'lucide-react';

type EntryActionsProps = {
  onCreateIdea: () => void;
  onCreateQuickNote: () => void;
  onCreateNote: () => void;
  onCreateFlashCard: () => void;
  onCreateJournal: () => void;
  showAllEntries: boolean;
  onToggleShowAll: () => void;
  interfacePreferences?: {
    showQuickNotes: boolean;
    showIdeas: boolean;
    showFlashCards: boolean;
    showYouTube: boolean;
    showJournal: boolean;
    showNote: boolean;
  };
};

export function EntryActions({
  onCreateIdea,
  onCreateQuickNote,
  onCreateNote,
  onCreateFlashCard,
  onCreateJournal,
  showAllEntries,
  onToggleShowAll,
  interfacePreferences = {
    showQuickNotes: true,
    showIdeas: true,
    showFlashCards: true,
    showYouTube: true,
    showJournal: true,
    showNote: false
  }
}: EntryActionsProps) {
  return (
    <div className="flex gap-2">
      {interfacePreferences.showIdeas && (
        <button
          onClick={onCreateIdea}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d9edb]/20 text-[#2d9edb] rounded-xl hover:bg-[#2d9edb]/30 transition-colors"
        >
          <Lightbulb size={20} />
          <span className="hidden sm:inline">Idea</span>
        </button>
      )}

      {interfacePreferences.showQuickNotes && (
        <button
          onClick={onCreateQuickNote}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d9edb]/20 text-[#2d9edb] rounded-xl hover:bg-[#2d9edb]/30 transition-colors"
        >
          <FileText size={20} />
          <span className="hidden sm:inline">Quick Note</span>
        </button>
      )}

      {interfacePreferences.showNote && (
        <button
          onClick={onCreateNote}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d9edb]/20 text-[#2d9edb] rounded-xl hover:bg-[#2d9edb]/30 transition-colors"
        >
          <Edit size={20} />
          <span className="hidden sm:inline">Note</span>
        </button>
      )}

      {interfacePreferences.showJournal && (
        <button
          onClick={onCreateJournal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d9edb]/20 text-[#2d9edb] rounded-xl hover:bg-[#2d9edb]/30 transition-colors"
        >
          <Book size={20} />
          <span className="hidden sm:inline">Journal</span>
        </button>
      )}

      {interfacePreferences.showFlashCards && (
        <button
          onClick={onCreateFlashCard}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d9edb]/20 text-[#2d9edb] rounded-xl hover:bg-[#2d9edb]/30 transition-colors"
        >
          <BookOpen size={20} />
          <span className="hidden sm:inline">Flash Card</span>
        </button>
      )}

      <button
        onClick={onToggleShowAll}
        className={`flex items-center gap-2 px-4 py-2.5 transition-colors rounded-xl ${
          !showAllEntries
            ? 'bg-[#2d9edb]/20 text-[#2d9edb] hover:bg-[#2d9edb]/30'
            : 'bg-[#2d9edb] text-white hover:bg-[#2d9edb]/90'
        }`}
        title={showAllEntries ? 'Hide all entries' : 'Show all entries'}
      >
        <Eye size={20} />
        <span className="hidden sm:inline">{showAllEntries ? 'Hide All' : 'Show All'}</span>
      </button>
    </div>
  );
}