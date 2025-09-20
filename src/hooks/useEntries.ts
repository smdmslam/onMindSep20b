import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase, type Entry } from '../lib/supabase';

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
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

  const createEntry = async (data: Partial<Entry>) => {
    try {
      const { error } = await supabase
        .from('entries')
        .insert([data]);

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

  const updateEntry = async (id: string, data: Partial<Entry>) => {
    try {
      const { error } = await supabase
        .from('entries')
        .update(data)
        .eq('id', id);

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

  const deleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

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
      const { error } = await supabase
        .from('entries')
        .update({ is_favorite: isFavorite })
        .eq('id', id);

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
      const { error } = await supabase
        .from('entries')
        .update({ is_pinned: isPinned })
        .eq('id', id);

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
    createEntry,
    updateEntry,
    deleteEntry,
    toggleFavorite,
    togglePin
  };
}