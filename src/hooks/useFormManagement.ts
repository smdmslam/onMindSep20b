import { useState } from 'react';
import type { Entry } from '../lib/firebase-client';

type EntryMode = 'idea' | 'quick' | 'flash' | 'journal' | 'note';

export function useFormManagement(setSelectedCategory: (category: string) => void) {
  const [showForm, setShowForm] = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [entryMode, setEntryMode] = useState<EntryMode>('quick');

  const handleCreateIdea = () => {
    setShowIdeaForm(true);
    setShowForm(false);
    setShowQuickNote(false);
    setShowNoteForm(false);
    setShowJournalForm(false);
    setSelectedCategory('Ideas');
  };

  const handleCreateQuickNote = () => {
    setShowQuickNote(true);
    setShowForm(false);
    setShowNoteForm(false);
    setShowIdeaForm(false);
    setShowJournalForm(false);
    setSelectedCategory('Quick Note');
  };

  const handleCreateNote = () => {
    setShowNoteForm(true);
    setShowForm(false);
    setShowQuickNote(false);
    setShowIdeaForm(false);
    setShowJournalForm(false);
    setEntryMode('note');
    // Don't set category filter since user can choose any category
  };

  const handleCreateJournal = () => {
    setShowJournalForm(true);
    setShowForm(false);
    setShowQuickNote(false);
    setShowNoteForm(false);
    setShowIdeaForm(false);
    setSelectedCategory('Journal');
  };

  const handleCreateFlashCard = () => {
    setEntryMode('flash');
    setShowForm(true);
    setShowQuickNote(false);
    setShowNoteForm(false);
    setShowIdeaForm(false);
    setShowJournalForm(false);
    setSelectedCategory('Flash Card');
  };

  const handleEditEntry = (entry: Entry) => {
    setEditingEntry(entry);
    
    // Show the appropriate form based on category or tags
    if (entry.tags.includes('Note') && entry.category !== 'Quick Note') {
      // If entry has 'Note' tag but isn't a Quick Note, use Note form
      setShowNoteForm(true);
      setShowForm(false);
      setShowQuickNote(false);
      setShowIdeaForm(false);
      setShowJournalForm(false);
      setEntryMode('note');
    } else {
      switch (entry.category) {
        case 'Journal':
          setShowJournalForm(true);
          setShowForm(false);
          setShowQuickNote(false);
          setShowNoteForm(false);
          setShowIdeaForm(false);
          setEntryMode('journal');
          break;
        case 'Ideas':
          setShowIdeaForm(true);
          setShowForm(false);
          setShowQuickNote(false);
          setShowNoteForm(false);
          setShowJournalForm(false);
          setEntryMode('idea');
          break;
        case 'Quick Note':
          setShowQuickNote(true);
          setShowForm(false);
          setShowNoteForm(false);
          setShowIdeaForm(false);
          setShowJournalForm(false);
          setEntryMode('quick');
          break;
        case 'Flash Card':
          setShowForm(true);
          setShowQuickNote(false);
          setShowNoteForm(false);
          setShowIdeaForm(false);
          setShowJournalForm(false);
          setEntryMode('flash');
          break;
        default:
          // For any other category, use the note form if it has Note tag, otherwise use standard form
          if (entry.tags.includes('Note')) {
            setShowNoteForm(true);
            setShowForm(false);
            setShowQuickNote(false);
            setShowIdeaForm(false);
            setShowJournalForm(false);
            setEntryMode('note');
          } else {
            setShowForm(true);
            setShowQuickNote(false);
            setShowNoteForm(false);
            setShowIdeaForm(false);
            setShowJournalForm(false);
            setEntryMode('quick');
          }
      }
    }
    
    // Set the category filter to match the entry being edited
    setSelectedCategory(entry.category);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setShowQuickNote(false);
    setShowNoteForm(false);
    setShowIdeaForm(false);
    setShowJournalForm(false);
    setEditingEntry(null);
  };

  return {
    showForm,
    showQuickNote,
    showNoteForm,
    showIdeaForm,
    showJournalForm,
    editingEntry,
    entryMode,
    handleCreateIdea,
    handleCreateQuickNote,
    handleCreateNote,
    handleCreateJournal,
    handleCreateFlashCard,
    handleEditEntry,
    handleCloseForm
  };
}