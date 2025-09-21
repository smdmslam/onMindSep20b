import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { updateEntry } from '../lib/firebase-client';
import type { Entry } from '../lib/firebase-client';
import { DEFAULT_CATEGORIES } from '../lib/constants';

export function useCategories(entries: Entry[], onEntriesChange: () => void) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Get existing categories from entries (same approach as tags)
  const existingCategories = Array.from(
    new Set(entries.map(entry => entry.category))
  ).sort();

  // Note: Categories are discovered dynamically like tags - no need to create placeholder entries

  const deleteCategory = useCallback(async (categoryToDelete: string, replacementCategory: string) => {
    try {
      // Find all entries with the category to delete
      const entriesToUpdate = entries.filter(entry => 
        entry.category === categoryToDelete || 
        entry.category.match(/^\(\d+\)$/) || // numeric categories
        entry.category === 'Code Vault'
      );

      if (entriesToUpdate.length > 0) {
        // Update all entries with this category using Firebase
        for (const entry of entriesToUpdate) {
          const { error } = await updateEntry(entry.id, { category: replacementCategory });
          if (error) throw error;
        }
      }
      
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
  }, [entries, selectedCategory, onEntriesChange]);

  // Categories are discovered automatically from entries - no need for explicit creation

  const renameCategory = useCallback(async (oldCategory: string, newCategory: string) => {
    try {
      if (DEFAULT_CATEGORIES.includes(oldCategory)) {
        toast.error('Cannot rename default categories');
        return false;
      }

      if ([...DEFAULT_CATEGORIES, ...existingCategories].includes(newCategory)) {
        toast.error('This category name already exists');
        return false;
      }

      // Find all entries with the old category
      const entriesToUpdate = entries.filter(entry => entry.category === oldCategory);

      if (entriesToUpdate.length > 0) {
        // Update all entries with this category using Firebase
        for (const entry of entriesToUpdate) {
          const { error } = await updateEntry(entry.id, { category: newCategory });
          if (error) throw error;
        }
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
  }, [existingCategories, selectedCategory, onEntriesChange]);

  return {
    selectedCategory,
    setSelectedCategory,
    existingCategories,
    deleteCategory,
    renameCategory
  };
}