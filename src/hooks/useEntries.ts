import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { type Entry, getEntries, createEntry, updateEntry, deleteEntry } from '../lib/firebase-client';

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const { data, error } = await getEntries();
      
      if (error) {
        console.error('Firebase error:', error);
        throw error;
      }

      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, []);

  const addEntry = async (data: Partial<Entry>) => {
    try {
      const { error } = await createEntry(data);

      if (error) throw error;
      toast.success('Entry created successfully');
      await fetchEntries();
      return true;
    } catch (error) {
      console.error('Error creating entry:', error);
      toast.error('Failed to create entry');
      return false;
    }
  };

  const modifyEntry = async (id: string, data: Partial<Entry>) => {
    try {
      const { error } = await updateEntry(id, data);

      if (error) throw error;
      toast.success('Entry updated successfully');
      await fetchEntries();
      return true;
    } catch (error) {
      console.error('Error updating entry:', error);
      toast.error('Failed to update entry');
      return false;
    }
  };

  const removeEntry = async (id: string) => {
    try {
      const { error } = await deleteEntry(id);

      if (error) throw error;
      toast.success('Entry deleted successfully');
      await fetchEntries();
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
      return false;
    }
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const { error } = await updateEntry(id, { is_favorite: isFavorite });

      if (error) throw error;
      await fetchEntries();
      return true;
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error('Failed to update favorite status');
      return false;
    }
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    try {
      const { error } = await updateEntry(id, { is_pinned: isPinned });

      if (error) throw error;
      await fetchEntries();
      return true;
    } catch (error) {
      console.error('Error updating pin status:', error);
      toast.error('Failed to update pin status');
      return false;
    }
  };

  return {
    entries,
    loading,
    fetchEntries,
    createEntry: addEntry,
    updateEntry: modifyEntry,
    deleteEntry: removeEntry,
    toggleFavorite,
    togglePin
  };
}