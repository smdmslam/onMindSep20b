import { useMemo } from 'react';
import type { Entry } from '../lib/supabase';

export function useEntryFiltering(
  entries: Entry[],
  searchQuery: string,
  selectedCategory: string,
  selectedTags: string[],
  showAllEntries: boolean
) {
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (!showAllEntries && !selectedCategory && selectedTags.length === 0 && !searchQuery) {
        return false;
      }

      const matchesSearch = searchQuery
        ? entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.explanation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;

      const matchesCategory = selectedCategory
        ? selectedCategory === 'Favorites'
          ? entry.is_favorite
          : entry.category === selectedCategory
        : true;

      const matchesTags = selectedTags.length > 0
        ? selectedTags.every(tag => entry.tags.includes(tag))
        : true;

      return matchesSearch && matchesCategory && matchesTags;
    });
  }, [entries, searchQuery, selectedCategory, selectedTags, showAllEntries]);

  return filteredEntries;
}