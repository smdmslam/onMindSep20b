import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { Entry } from '../lib/firebase-client';
import { DEFAULT_CATEGORIES } from '../lib/constants';

export function useCategories(entries: Entry[], onEntriesChange: () => void) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Get existing categories from entries, filtering out any numeric placeholders
  const existingCategories = Array.from(
    new Set(entries.map(entry => entry.category))
  ).filter(cat => !cat.match(/^\(\d+\)$/));

  // Combine default and custom categories
  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...existingCategories])
  ).sort();

  const deleteCategory = useCallback(async (categoryToDelete: string, replacementCategory: string) => {
    try {
      // First, get all entries with the category to delete
      const { data: entriesToUpdate, error: fetchError } = await supabase
        .from('entries')
        .select('id')
        .eq('category', categoryToDelete);

      if (fetchError) throw fetchError;

      if (entriesToUpdate && entriesToUpdate.length > 0) {
        // Update all entries with this category in a single query
        const { error: updateError } = await supabase
          .from('entries')
          .update({ category: replacementCategory })
          .in('id', entriesToUpdate.map(entry => entry.id));
        
        if (updateError) throw updateError;
      }

      // Clean up any entries with numeric categories or Code Vault category
      // Using separate queries for each condition to avoid complex OR logic
      const { error: numericCleanupError } = await supabase
        .from('entries')
        .update({ category: replacementCategory })
        .like('category', '(%)')
        .not('category', 'ilike', '%(created)%');

      if (numericCleanupError) throw numericCleanupError;

      const { error: codeVaultCleanupError } = await supabase
        .from('entries')
        .update({ category: replacementCategory })
        .eq('category', 'Code Vault');

      if (codeVaultCleanupError) throw codeVaultCleanupError;
      
      // Update selected category if needed
      if (selectedCategory === categoryToDelete) {
        setSelectedCategory(replacementCategory);
      }
      
      toast.success(`Category "${categoryToDelete}" deleted successfully`);
      onEntriesChange();
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
      return false;
    }
  }, [selectedCategory, onEntriesChange]);

  const addCategory = useCallback(async (newCategory: string) => {
    try {
      if (allCategories.includes(newCategory)) {
        toast.error('This category already exists');
        return false;
      }

      // Create a minimal entry to establish the category
      const { error } = await supabase
        .from('entries')
        .insert([{
          title: 'Category Created',
          content: ' ',
          category: newCategory,
          tags: ['system'],
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      toast.success(`Category "${newCategory}" created successfully`);
      onEntriesChange();
      return true;
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
      return false;
    }
  }, [allCategories, onEntriesChange]);

  const renameCategory = useCallback(async (oldCategory: string, newCategory: string) => {
    try {
      if (DEFAULT_CATEGORIES.includes(oldCategory)) {
        toast.error('Cannot rename default categories');
        return false;
      }

      if (allCategories.includes(newCategory)) {
        toast.error('This category name already exists');
        return false;
      }

      // First, get all entries with the old category
      const { data: entriesToUpdate, error: fetchError } = await supabase
        .from('entries')
        .select('id')
        .eq('category', oldCategory);

      if (fetchError) throw fetchError;

      if (entriesToUpdate && entriesToUpdate.length > 0) {
        // Update all entries with this category in a single query
        const { error: updateError } = await supabase
          .from('entries')
          .update({ category: newCategory })
          .in('id', entriesToUpdate.map(entry => entry.id));
        
        if (updateError) throw updateError;
      }
      
      // Update selected category if needed
      if (selectedCategory === oldCategory) {
        setSelectedCategory(newCategory);
      }
      
      toast.success(`Category "${oldCategory}" renamed to "${newCategory}"`);
      onEntriesChange();
      return true;
    } catch (error) {
      console.error('Error renaming category:', error);
      toast.error('Failed to rename category');
      return false;
    }
  }, [allCategories, selectedCategory, onEntriesChange]);

  return {
    selectedCategory,
    setSelectedCategory,
    existingCategories,
    allCategories,
    deleteCategory,
    addCategory,
    renameCategory
  };
}