import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { createEntry, updateEntry, auth } from '../lib/firebase-client';
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

  const addCategory = useCallback(async (newCategory: string) => {
    try {
      if (allCategories.includes(newCategory)) {
        toast.error('This category already exists');
        return false;
      }

      // Create a minimal entry to establish the category
      const { error } = await createEntry({
        title: 'Category Created',
        content: ' ',
        category: newCategory,
        tags: ['system'],
        is_favorite: false,
        is_pinned: false,
        is_flashcard: false,
        explanation: null
      });

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