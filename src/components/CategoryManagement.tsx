import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertTriangle, Youtube, FileText, Lightbulb, BookOpen, Book, Eye, EyeOff, Key, UserCircle, Download, Trash } from 'lucide-react';
import { DEFAULT_CATEGORIES } from '../lib/constants';
import type { Entry } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { exportToCSV, generateCSVTemplate } from '../lib/csv';
import { MoodTracking } from './MoodTracking';

type CategoryManagementProps = {
  isOpen: boolean;
  onClose: () => void;
  existingCategories: string[];
  entries: Entry[];
  onDeleteCategory: (category: string, newCategory: string) => Promise<void>;
  youtubeSettings: {
    autoAddChannelAsTag: boolean;
  };
  onUpdateYoutubeSettings: (settings: { autoAddChannelAsTag: boolean }) => void;
  interfacePreferences: {
    showQuickNotes: boolean;
    showIdeas: boolean;
    showFlashCards: boolean;
    showYouTube: boolean;
    showJournal: boolean;
    showCategories: boolean;
    showTags: boolean;
  };
  onUpdateInterfacePreferences: (preferences: {
    showQuickNotes: boolean;
    showIdeas: boolean;
    showFlashCards: boolean;
    showYouTube: boolean;
    showJournal: boolean;
    showCategories: boolean;
    showTags: boolean;
  }) => void;
};

export function CategoryManagement({ 
  isOpen,
  onClose,
  existingCategories,
  entries,
  onDeleteCategory,
  youtubeSettings,
  onUpdateYoutubeSettings,
  interfacePreferences,
  onUpdateInterfacePreferences
}: CategoryManagementProps) {
  const [activeTab, setActiveTab] = useState<'interface' | 'categories' | 'youtube' | 'account' | 'export' | 'mood'>('interface');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [replacementCategory, setReplacementCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [accountInfo, setAccountInfo] = useState<{
    email: string;
    createdAt: string;
    lastSignIn: string;
  } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    const fetchAccountInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: sessions } = await supabase.auth.getSession();
        setAccountInfo({
          email: user.email || '',
          createdAt: new Date(user.created_at).toLocaleString(),
          lastSignIn: sessions?.session?.created_at 
            ? new Date(sessions.session.created_at).toLocaleString()
            : 'Never'
        });
      }
    };
    
    if (activeTab === 'account') {
      fetchAccountInfo();
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Filter out numeric categories and get valid categories
  const validCategories = existingCategories.filter(cat => !cat.match(/^\(\d+\)$/));
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...validCategories])).sort();
  
  // Count entries per category
  const categoryCounts = allCategories.reduce<Record<string, number>>((acc, category) => {
    acc[category] = entries.filter(entry => entry.category === category).length;
    return acc;
  }, {});

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategory.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    if (allCategories.includes(newCategory)) {
      toast.error('This category already exists');
      return;
    }

    setIsCreating(true);

    try {
      // Create a placeholder entry with the new category
      const { error } = await supabase
        .from('entries')
        .insert([{
          title: `${newCategory} Category Created`,
          content: `This is a placeholder entry for the new category "${newCategory}".`,
          category: newCategory,
          tags: ['system'],
          user_id: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      toast.success(`Category "${newCategory}" created successfully`);
      setNewCategory('');
      setIsAddingCategory(false);
      
      // Close the settings modal to trigger a refresh
      onClose();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete || !onDeleteCategory) return;
    
    setIsDeleting(true);
    try {
      await onDeleteCategory(categoryToDelete, replacementCategory);
      setCategoryToDelete(null);
      
      // Close the settings modal to trigger a refresh
      onClose();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInterfacePreferenceChange = (key: keyof typeof interfacePreferences) => {
    // Count currently enabled buttons
    const enabledCount = Object.entries(interfacePreferences).reduce((count, [k, v]) => {
      // Only count the relevant buttons (Quick Notes, Ideas, Journal, Flash Cards)
      if (k !== 'showYouTube' && k !== 'showCategories' && k !== 'showTags' && v) {
        return count + 1;
      }
      return count;
    }, 0);

    const newValue = !interfacePreferences[key];

    // If trying to enable and already at max, show error
    if (newValue && enabledCount >= 3 && !['showYouTube', 'showCategories', 'showTags'].includes(key)) {
      toast.error('Maximum 3 buttons allowed. Disable another button first.');
      return;
    }

    const newPreferences = {
      ...interfacePreferences,
      [key]: newValue
    };
    onUpdateInterfacePreferences(newPreferences);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const lines = content.split('\n');
      
      if (lines.length < 2) {
        toast.error('CSV file is empty or invalid');
        return;
      }

      const headers = lines[0].toLowerCase().split(',');
      const requiredHeaders = ['title', 'content', 'category'];
      
      // Verify required headers
      for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
          toast.error(`Missing required column: ${required}`);
          return;
        }
      }

      // Parse rows (skip header)
      const entries = lines.slice(1).map(line => {
        const values = line.split(',').map(value => 
          value.trim().replace(/^"(.*)"$/, '$1').replace(/""/g, '"')
        );
        
        return {
          title: values[headers.indexOf('title')],
          content: values[headers.indexOf('content')],
          category: values[headers.indexOf('category')],
          explanation: headers.includes('explanation') ? values[headers.indexOf('explanation')] : '',
          url: headers.includes('url') ? values[headers.indexOf('url')] : '',
          tags: headers.includes('tags') 
            ? values[headers.indexOf('tags')].split(';').map(tag => tag.trim()).filter(Boolean)
            : [],
          is_favorite: headers.includes('favorite') 
            ? values[headers.indexOf('favorite')].toLowerCase() === 'yes'
            : false,
          is_pinned: headers.includes('pinned')
            ? values[headers.indexOf('pinned')].toLowerCase() === 'yes'
            : false
        };
      });

      // Create entries in Supabase
      for (const entry of entries) {
        const { error } = await supabase
          .from('entries')
          .insert([{
            ...entry,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }]);
        
        if (error) throw error;
      }

      toast.success(`Successfully imported ${entries.length} entries`);
      onClose(); // Close settings to trigger refresh
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error('Failed to import CSV file');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== accountInfo?.email) {
      toast.error('Email confirmation does not match');
      return;
    }

    try {
      // Delete all user's entries
      const { error: deleteEntriesError } = await supabase
        .from('entries')
        .delete()
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (deleteEntriesError) throw deleteEntriesError;

      // Delete user account
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(
        (await supabase.auth.getUser()).data.user?.id || ''
      );

      if (deleteUserError) throw deleteUserError;

      toast.success('Account deleted successfully');
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 overflow-y-auto">
      <div className="bg-gradient-to-br from-[#2d1b69]/90 to-[#1a1a1a] border border-white/20 rounded-xl p-5 max-w-3xl w-full shadow-xl backdrop-blur-sm my-4">
        <h2 className="text-xl font-semibold text-white mb-3 flex items-center">
          <span className="bg-[#2d9edb]/20 p-1.5 rounded-lg mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2d9edb]">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </span>
          Settings
        </h2>
        
        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('interface')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'interface' 
                ? 'text-[#2d9edb] border-b-2 border-[#2d9edb]' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Interface
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'categories' 
                ? 'text-[#2d9edb] border-b-2 border-[#2d9edb]' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'youtube' 
                ? 'text-[#2d9edb] border-b-2 border-[#2d9edb]' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            YouTube
          </button>
          <button
            onClick={() => setActiveTab('mood')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'mood' 
                ? 'text-[#2d9edb] border-b-2 border-[#2d9edb]' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Mood Tracking
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'account' 
                ? 'text-[#2d9edb] border-b-2 border-[#2d9edb]' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === 'export' 
                ? 'text-[#2d9edb] border-b-2 border-[#2d9edb]' 
                : 'text-white/60 hover:text-white'
            }`}
          >
            Export
          </button>
        </div>

        {/* Interface Tab */}
        {activeTab === 'interface' && (
          <div className="mb-6">
            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
              <h3 className="text-lg font-medium text-white mb-4">
                Interface Preferences
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2d9edb]/20 rounded-lg">
                      <FileText size={20} className="text-[#2d9edb]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Quick Notes</h4>
                      <p className="text-xs text-white/60">Enable quick note taking functionality</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interfacePreferences.showQuickNotes}
                      onChange={() => handleInterfacePreferenceChange('showQuickNotes')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d9edb]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2d9edb]/20 rounded-lg">
                      <Book size={20} className="text-[#2d9edb]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Journal</h4>
                      <p className="text-xs text-white/60">Enable journal entry functionality</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interfacePreferences.showJournal}
                      onChange={() => handleInterfacePreferenceChange('showJournal')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d9edb]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2d9edb]/20 rounded-lg">
                      <Lightbulb size={20} className="text-[#2d9edb]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Ideas</h4>
                      <p className="text-xs text-white/60">Enable idea capture functionality</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interfacePreferences.showIdeas}
                      onChange={() => handleInterfacePreferenceChange('showIdeas')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d9edb]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2d9edb]/20 rounded-lg">
                      <BookOpen size={20} className="text-[#2d9edb]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Flash Cards</h4>
                      <p className="text-xs text-white/60">Enable flash card learning system</p>
                      <p className="text-xs text-white/40 mt-1">Note: Maximum 3 buttons allowed between Quick Notes, Ideas, Journal, and Flash Cards</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interfacePreferences.showFlashCards}
                      onChange={() => handleInterfacePreferenceChange('showFlashCards')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d9edb]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2d9edb]/20 rounded-lg">
                      <Youtube size={20} className="text-[#2d9edb]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">YouTube Integration</h4>
                      <p className="text-xs text-white/60">Enable YouTube video management features</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interfacePreferences.showYouTube}
                      onChange={() => handleInterfacePreferenceChange('showYouTube')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d9edb]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2d9edb]/20 rounded-lg">
                      {interfacePreferences.showCategories ? (
                        <Eye size={20} className="text-[#2d9edb]" />
                      ) : (
                        <EyeOff size={20} className="text-[#2d9edb]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Categories Section</h4>
                      <p className="text-xs text-white/60">Show or hide the categories section</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interfacePreferences.showCategories}
                      onChange={() => handleInterfacePreferenceChange('showCategories')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d9edb]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2d9edb]/20 rounded-lg">
                      {interfacePreferences.showTags ? (
                        <Eye size={20} className="text-[#2d9edb]" />
                      ) : (
                        <EyeOff size={20} className="text-[#2d9edb]" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Tags Section</h4>
                      <p className="text-xs text-white/60">Show or hide the tags section</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={interfacePreferences.showTags}
                      onChange={() => handleInterfacePreferenceChange('showTags')}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d9edb]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">
                Categories
              </h3>
              <button
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#2d9edb]/20 text-[#2d9edb] rounded-lg hover:bg-[#2d9edb]/30 transition-colors text-sm"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>
            
            <div className="bg-black/30 rounded-lg p-4 mb-4 border border-white/5">
              <h3 className="text-xs font-medium text-white/80 mb-3">
                Default Categories
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {DEFAULT_CATEGORIES.map(category => (
                  <div key={category} className="flex flex-col px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors rounded-lg border border-white/5">
                    <span className="text-sm text-white font-medium truncate">{category}</span>
                    <span className="text-xs text-[#2d9edb] bg-[#2d9edb]/10 px-1.5 py-0.5 rounded-full self-start mt-1">
                      {categoryCounts[category] || 0} entries
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {validCategories.filter(cat => !DEFAULT_CATEGORIES.includes(cat)).length > 0 && (
              <div className="bg-black/30 rounded-lg p-4 border border-white/5">
                <h3 className="text-xs font-medium text-white/80 mb-3">
                  Custom Categories
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {validCategories
                    .filter(cat => !DEFAULT_CATEGORIES.includes(cat))
                    .map(category => (
                      <div key={category} className="flex flex-col px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors rounded-lg border border-white/5 group">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white font-medium truncate">{category}</span>
                          <button
                            onClick={() => setCategoryToDelete(category)}
                            className="p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                            title="Delete category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <span className="text-xs text-[#2d9edb] bg-[#2d9edb]/10 px-1.5 py-0.5 rounded-full self-start mt-1">
                          {categoryCounts[category] || 0} entries
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Add Category Form */}
            {isAddingCategory && (
              <div className="mt-4 bg-black/30 rounded-lg p-4 border border-white/5">
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-1">
                      New Category Name
                    </label>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
                      placeholder="Enter category name"
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategory('');
                      }}
                      className="px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      disabled={isCreating}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-sm bg-[#2d9edb] text-white rounded-lg hover:bg-[#2d9edb]/90 transition-colors disabled:opacity-50"
                      disabled={isCreating}
                    >
                      {isCreating ? 'Creating...' : 'Add Category'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* YouTube Tab */}
        {activeTab === 'youtube' && (
          <div className="mb-6">
            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
              <h3 className="text-lg font-medium text-white mb-4">
                YouTube Settings
              </h3>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div>
                  <h4 className="text-sm font-medium text-white">Auto-add Channel as Tag</h4>
                  <p className="text-xs text-white/60">Automatically add YouTube channel names as tags when saving videos</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={youtubeSettings.autoAddChannelAsTag}
                    onChange={(e) => onUpdateYoutubeSettings({ autoAddChannelAsTag: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2d9edb]"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Mood Tracking Tab */}
        {activeTab === 'mood' && (
          <div className="mb-6">
            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
              <h3 className="text-lg font-medium text-white mb-4">
                Mood Tracking
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-white/60">
                  Track your mood over time with journal entries. Each entry can be tagged with your current mood to help you understand patterns and trends.
                </p>
                <MoodTracking entries={entries} />
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className="mb-6">
            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
              <h3 className="text-lg font-medium text-white mb-4">
                Account Information
              </h3>
              {accountInfo && (
                <div className="space-y-6">
                  {/* Account Details */}
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#2d9edb]/20 rounded-lg">
                        <UserCircle size={24} className="text-[#2d9edb]" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">{accountInfo.email}</h4>
                        <p className="text-xs text-white/60">Account created: {accountInfo.createdAt}</p>
                        <p className="text-xs text-white/60">Last sign in: {accountInfo.lastSignIn}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px] p-3 bg-white/5 rounded-lg">
                        <h5 className="text-sm font-medium text-white mb-1">Total Entries</h5>
                        <p className="text-2xl font-bold text-[#2d9edb]">{entries.length}</p>
                      </div>
                      <div className="flex-1 min-w-[200px] p-3 bg-white/5 rounded-lg">
                        <h5 className="text-sm font-medium text-white mb-1">Categories</h5>
                        <p className="text-2xl font-bold text-[#2d9edb]">{validCategories.length}</p>
                      </div>
                      <div className="flex-1 min-w-[200px] p-3 bg-white/5 rounded-lg">
                        <h5 className="text-sm font-medium text-white mb-1">Tags</h5>
                        <p className="text-2xl font-bold text-[#2d9edb]">
                          {Array.from(new Set(entries.flatMap(entry => entry.tags))).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Security Section */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Security</h4>
                    {!isChangingPassword ? (
                      <button
                        onClick={() => setIsChangingPassword(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2d9edb]/20 text-[#2d9edb] rounded-lg hover:bg-[#2d9edb]/30 transition-colors"
                      >
                        <Key size={18} />
                        Change Password
                      </button>
                    ) : (
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
                            placeholder="Enter new password"
                            minLength={6}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-1">
                            Confirm New Password
                          </label>
                          <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
                            placeholder="Confirm new password"
                            minLength={6}
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsChangingPassword(false);
                              setPasswordForm({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              });
                            }}
                            className="px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1.5 text-sm bg-[#2d9edb] text-white rounded-lg hover:bg-[#2d9edb]/90 transition-colors"
                          >
                            Update Password
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Data Management */}
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Data Management</h4>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => exportToCSV(entries)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#2d9edb]/20 text-[#2d9edb] rounded-lg hover:bg-[#2d9edb]/30 transition-colors"
                      >
                        <Download size={18} />
                        Download Data
                      </button>
                      <button
                        onClick={() => setIsConfirmingDelete(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        <Trash size={18} />
                        Delete Account
                      </button>
                    </div>
                  </div>

                  {/* Delete Account Confirmation */}
                  {isConfirmingDelete && (
                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-red-500/20 rounded-lg shrink-0">
                          <AlertTriangle size={20} className="text-red-400" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white mb-1">Delete Account</h4>
                          <p className="text-sm text-white/60">
                            This action cannot be undone. All your data will be permanently deleted.
                            Please type your email address to confirm.
                          </p>
                        </div>
                      </div>
                      <input
                        type="email"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder={accountInfo.email}
                        className="w-full px-3 py-2 bg-black/40 border border-red-500/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50 mb-4"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setIsConfirmingDelete(false);
                            setDeleteConfirmation('');
                          }}
                          className="px-3 py-1.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmation !== accountInfo.email}
                          className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="mb-6">
            <div className="bg-black/30 rounded-lg p-4 border border-white/5">
              <h3 className="text-lg font-medium text-white mb-4">
                Export & Import
              </h3>
              <div className="space-y-6">
                {/* Export Section */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Export Entries</h4>
                  <p className="text-sm text-white/60 mb-3">
                    Export all your entries to a CSV file that you can backup or import into another account.
                  </p>
                  <button
                    onClick={() => exportToCSV(entries)}
                    className="px-4 py-2 bg-[#2d9edb]/20 text-[#2d9edb] rounded-lg hover:bg-[#2d9edb]/30 transition-colors text-sm"
                  >
                    Export to CSV
                  </button>
                </div>

                <div className="border-t border-white/10"></div>

                {/* Import Section */}
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Import Entries</h4>
                  <p className="text-sm text-white/60 mb-3">
                    Import entries from a CSV file. Make sure to follow the template format.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={generateCSVTemplate}
                      className="px-4 py-2 bg-[#2d9edb]/20 text-[#2d9edb] rounded-lg hover:bg-[#2d9edb]/30 transition-colors text-sm"
                    >
                      Download Template
                    </button>
                    <label className="px-4 py-2 bg-[#2d9edb] text-white rounded-lg hover:bg-[#2d9edb]/90 transition-colors text-sm cursor-pointer">
                      Import CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    Note: The CSV file must include title, content, and category columns. Other fields are optional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Category Confirmation Dialog */}
        {categoryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-gradient-to-br from-[#2d1b69]/90 to-[#1a1a1a] border border-white/20 rounded-xl p-4 max-w-md w-full shadow-xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-amber-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
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
                      onClick={handleDeleteCategory}
                      className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 font-medium"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Category'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#2d9edb] text-white rounded-lg hover:bg-[#2d9edb]/90 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}