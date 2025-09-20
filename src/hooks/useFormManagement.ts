import { useState } from 'react';
import type { Entry } from '../lib/supabase';

type EntryMode = 'idea' | 'quick' | 'flash' | 'journal';

export function useFormManagement(setSelectedCategory: (category: string) => void) {
  const [showForm, setShowForm] = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>('quick');

  const handleCreateIdea = () => {
    setShowIdeaForm(true);
    setShowForm(false);
    setShowQuickNote(false);
    setShowJournalForm(false);
    setSelectedCategory('Ideas');
  };

  const handleCreateQuickNote = () => {
    setShowQuickNote(true);
    setShowForm(false);
    setShowIdeaForm(false);
    setShowJournalForm(false);
    setSelectedCategory('Quick Note');
  };

  const handleCreateJournal = () => {
    setShowJournalForm(true);
    setShowForm(false);
    setShowQuickNote(false);
    setShowIdeaForm(false);
    setSelectedCategory('Journal');
  };

  const handleCreateFlashCard = () => {
    setEntryMode('flash');
    setShowForm(true);
    setShowQuickNote(false);
    setShowIdeaForm(false);
    setShowJournalForm(false);
    setSelectedCategory('Flash Card');
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    
    // Show the appropriate form based on category
    switch (entry.category) {
      case 'Journal':
        setShowJournalForm(true);
        setShowForm(false);
        setShowQuickNote(false);
        setShowIdeaForm(false);
        setEntryMode('journal');
        break;
      case 'Ideas':
        setShowIdeaForm(true);
        setShowForm(false);
        setShowQuickNote(false);
        setShowJournalForm(false);
        setEntryMode('idea');
        break;
      case 'Quick Note':
        setShowQuickNote(true);
        setShowForm(false);
        setShowIdeaForm(false);
        setShowJournalForm(false);
        setEntryMode('quick');
        break;
      case 'Flash Card':
        setShowForm(true);
        setShowQuickNote(false);
        setShowIdeaForm(false);
        setShowJournalForm(false);
        setEntryMode('flash');
        break;
      default:
        // For any other category, use the standard form
        setShowForm(true);
        setShowQuickNote(false);
        setShowIdeaForm(false);
        setShowJournalForm(false);
        setEntryMode('quick');
    }
    
    // Set the category filter to match the entry being edited
    setSelectedCategory(entry.category);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setShowQuickNote(false);
    setShowIdeaForm(false);
    setShowJournalForm(false);
    setEditingEntry(null);
  };

  return {
    showForm,
    showQuickNote,
    showIdeaForm,
    showJournalForm,
    editingEntry,
    entryMode,
    handleCreateIdea,
    handleCreateQuickNote,
    handleCreateJournal,
    handleCreateFlashCard,
    handleEditEntry,
    handleCloseForm
  };
}