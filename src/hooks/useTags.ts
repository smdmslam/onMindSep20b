import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { updateEntry } from '../lib/firebase-client';
import type { Entry } from '../lib/firebase-client';

export function useTags(entries: Entry[], onEntriesChange: () => void) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const existingTags = Array.from(new Set(entries.flatMap(entry => entry.tags))).sort();

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }, []);

  const clearTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  const deleteTag = useCallback(async (tagToDelete: string) => {
    try {
      const entriesToUpdate = entries.filter(entry => entry.tags.includes(tagToDelete));
      
      if (entriesToUpdate.length > 0) {
        for (const entry of entriesToUpdate) {
          const updatedTags = entry.tags.filter(tag => tag !== tagToDelete);
          
          const { error } = await updateEntry(entry.id, { tags: updatedTags });
          
          if (error) throw error;
        }
      }
      
      if (selectedTags.includes(tagToDelete)) {
        setSelectedTags(prev => prev.filter(tag => tag !== tagToDelete));
      }
      
      toast.success(`Tag "${tagToDelete}" deleted successfully`);
      onEntriesChange();
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
      return false;
    }
  }, [entries, selectedTags, onEntriesChange]);

  return {
    selectedTags,
    setSelectedTags,
    existingTags,
    toggleTag,
    clearTags,
    deleteTag
  };
}