import React, { useState, useMemo } from 'react';
import { Tag, Edit2, Trash2, Check, X, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Entry } from '../lib/supabase';
import { DEFAULT_CATEGORIES } from '../lib/constants';

type CategoryFiltersProps = {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  entries: Entry[];
  onDeleteCategory?: (category: string, newCategory: string) => Promise<void>;
  onAddCategory?: (category: string) => Promise<boolean>;
  onRenameCategory?: (oldCategory: string, newCategory: string) => Promise<boolean>;
};

type EditMode = 'none' | 'delete' | 'rename';

export function CategoryFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  entries,
  onDeleteCategory,
  onAddCategory,
  onRenameCategory,
}: CategoryFiltersProps) {
  const [editMode, setEditMode] = useState<EditMode>('none');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [replacementCategory, setReplacementCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [editingCategory, setEditingCategory] = useState<{ original: string; new: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Filter out numeric categories and get valid categories
  const validCategories = categories.filter(cat => !cat.match(/^\(\d+\)$/));
  
  // Separate default and custom categories
  const customCategories = validCategories.filter(cat => !DEFAULT_CATEGORIES.includes(cat)).sort();
  
  // Count entries per category
  const categoryCounts = [...DEFAULT_CATEGORIES, ...customCategories].reduce<Record<string, number>>((acc, category) => {
    acc[category] = entries.filter(entry => entry.category === category).length;
    return acc;
  }, {});

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      onSelectCategory(''); // Deselect if clicking the same category
      setEditMode('none'); // Reset edit mode when deselecting
    } else {
      onSelectCategory(category);
    }
  };

  const isDefaultCategory = (category: string) => {
    return DEFAULT_CATEGORIES.includes(category);
  };

  const handleDeleteClick = (category: string) => {
    if (isDefaultCategory(category)) {
      toast.error('Cannot delete default categories');
      return;
    }
    setCategoryToDelete(category);
    setReplacementCategory(category === DEFAULT_CATEGORIES[0] ? DEFAULT_CATEGORIES[1] : DEFAULT_CATEGORIES[0]);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete || !onDeleteCategory) return;
    
    setIsDeleting(true);
    try {
      await onDeleteCategory(categoryToDelete, replacementCategory);
      setCategoryToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if ([...DEFAULT_CATEGORIES, ...customCategories].includes(newCategory)) {
      toast.error('This category already exists');
      return;
    }

    setIsCreating(true);
    try {
      if (onAddCategory) {
        const success = await onAddCategory(newCategory.trim());
        if (success) {
          setNewCategory('');
          setIsAddingCategory(false);
        }
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartRename = (category: string) => {
    if (isDefaultCategory(category)) {
      toast.error('Cannot rename default categories');
      return;
    }
    setEditingCategory({ original: category, new: category });
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory || !onRenameCategory) return;
    
    if (editingCategory.original === editingCategory.new || !editingCategory.new.trim()) {
      setEditingCategory(null);
      return;
    }

    if ([...DEFAULT_CATEGORIES, ...customCategories].includes(editingCategory.new)) {
      toast.error('This category name already exists');
      return;
    }

    try {
      const success = await onRenameCategory(editingCategory.original, editingCategory.new);
      if (success) {
        setEditingCategory(null);
      }
    } catch (error) {
      console.error('Error renaming category:', error);
    }
  };

  const toggleEditMode = (mode: EditMode) => {
    setEditMode(mode === editMode ? 'none' : mode);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-white/60" />
          <span className="text-sm text-white/60">
            Categories {selectedCategory && `(${selectedCategory})`}
          </span>
        </div>
        {selectedCategory && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              className="px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1 text-[#2d9edb] hover:bg-[#2d9edb]/20"
            >
              <Plus size={12} />
              Add Category
            </button>
            {onDeleteCategory && !isDefaultCategory(selectedCategory) && (
              <>
                <button
                  onClick={() => toggleEditMode('rename')}
                  className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                    editMode === 'rename'
                      ? 'bg-[#2d9edb] text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Edit2 size={12} />
                  {editMode === 'rename' ? 'Exit Rename' : 'Rename'}
                </button>
                <button
                  onClick={() => toggleEditMode('delete')}
                  className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                    editMode === 'delete'
                      ? 'bg-red-500 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Trash2 size={12} />
                  {editMode === 'delete' ? 'Exit Delete' : 'Delete'}
                </button>
              </>
            )}
            <button
              onClick={() => {
                onSelectCategory('');
                setEditMode('none');
              }}
              className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center gap-1"
            >
              <X size={12} />
              Clear filter
            </button>
          </div>
        )}
      </div>

      {isAddingCategory && (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-black/30 border border-[#2d9edb] rounded-lg text-sm text-white focus:outline-none"
            placeholder="New category name..."
            autoFocus
          />
          <button
            onClick={handleAddCategory}
            disabled={isCreating}
            className="px-3 py-1.5 bg-[#2d9edb] text-white rounded-lg text-sm hover:bg-[#2d9edb]/90 transition-colors disabled:opacity-50"
          >
            {isCreating ? 'Adding...' : 'Add'}
          </button>
          <button
            onClick={() => {
              setNewCategory('');
              setIsAddingCategory(false);
            }}
            className="px-3 py-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {/* Default Categories */}
        {DEFAULT_CATEGORIES.map((category) => (
          <div key={category} className="flex items-center gap-1">
            <button
              onClick={() => handleCategoryClick(category)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'
              }`}
            >
              {category} ({categoryCounts[category] || 0})
            </button>
          </div>
        ))}

        {/* Custom Categories */}
        {customCategories.map((category) => (
          <div key={category} className="flex items-center gap-1">
            {editingCategory?.original === category ? (
              <form onSubmit={handleRenameSubmit} className="flex items-center">
                <input
                  type="text"
                  value={editingCategory.new}
                  onChange={(e) => setEditingCategory({ ...editingCategory, new: e.target.value })}
                  className="px-2 py-1 text-xs bg-black/30 border border-[#2d9edb] rounded-l-full text-white focus:outline-none w-32"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1 bg-[#2d9edb] text-white rounded-r-full hover:bg-[#2d9edb]/90 transition-colors"
                >
                  <Check size={12} />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-[#2d9edb] text-white'
                      : 'bg-[#2d9edb]/20 text-[#2d9edb] hover:bg-[#2d9edb]/30'
                  }`}
                >
                  {category} ({categoryCounts[category] || 0})
                </button>
                {editMode === 'delete' && selectedCategory === category && !isDefaultCategory(category) && (
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
                {editMode === 'rename' && selectedCategory === category && !isDefaultCategory(category) && (
                  <button
                    onClick={() => handleStartRename(category)}
                    className="p-1 text-[#2d9edb] hover:text-[#2d9edb]/80 hover:bg-[#2d9edb]/20 rounded-full transition-colors"
                    title="Rename category"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Category Confirmation Dialog */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gradient-to-br from-[#2d1b69]/90 to-[#1a1a1a] border border-white/20 rounded-xl p-4 max-w-md w-full shadow-xl backdrop-blur-sm">
            <h3 className="text-base font-semibold text-white mb-2">Delete Category</h3>
            <p className="text-sm text-white/80 mb-4">
              Are you sure you want to delete the category "{categoryToDelete}"? 
              {categoryCounts[categoryToDelete] > 0 && (
                <> This will affect {categoryCounts[categoryToDelete]} entries.</>
              )}
            </p>
            
            {categoryCounts[categoryToDelete] > 0 && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-white/80 mb-1">
                  Move entries to:
                </label>
                <select
                  value={replacementCategory}
                  onChange={(e) => setReplacementCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
                >
                  {DEFAULT_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}