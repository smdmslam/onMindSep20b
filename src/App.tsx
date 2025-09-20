import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { supabase, type Entry, type AuthUser, signOut } from './lib/supabase';
import { TagFilters } from './components/TagFilters';
import { CategoryFilters } from './components/CategoryFilters';
import { ConfirmDialog } from './components/ConfirmDialog';
import { SplashScreen } from './components/SplashScreen';
import { CategoryManagement } from './components/CategoryManagement';
import { tourSteps } from './lib/tour';
import { VideoAccordion } from './components/VideoAccordion';
import { useEntries } from './hooks/useEntries';
import { useCategories } from './hooks/useCategories';
import { useTags } from './hooks/useTags';
import { usePlaylist } from './hooks/usePlaylist';
import { useFormManagement } from './hooks/useFormManagement';
import { useModalManagement } from './hooks/useModalManagement';
import { useEntryFiltering } from './hooks/useEntryFiltering';
import { scrollToTop } from './lib/utils';
import { Header } from './components/layout/Header';
import { EntryActions } from './components/layout/EntryActions';
import { ViewModeToggle } from './components/layout/ViewModeToggle';
import { EntryList } from './components/EntryList';
import { SearchBar } from './components/SearchBar';
import { AuthView } from './components/AuthView';
import { EntryForm } from './components/EntryForm';
import { QuickNoteForm } from './components/QuickNoteForm';
import { IdeaForm } from './components/IdeaForm';
import { JournalForm } from './components/JournalForm';

type ViewMode = 'card' | 'row' | 'line';

type YouTubeSettings = {
  autoAddChannelAsTag: boolean;
};

type InterfacePreferences = {
  showQuickNotes: boolean;
  showIdeas: boolean;
  showFlashCards: boolean;
  showYouTube: boolean;
  showJournal: boolean;
  showCategories: boolean;
  showTags: boolean;
};

function App() {
  const {
    entries,
    loading,
    fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    toggleFavorite,
    togglePin
  } = useEntries();

  const {
    selectedCategory,
    setSelectedCategory: setSelectedCategoryState,
    existingCategories,
    allCategories,
    deleteCategory,
    addCategory,
    renameCategory
  } = useCategories(entries, fetchEntries);

  // Create a new function to handle category selection
  const setSelectedCategory = (category: string) => {
    if (category === selectedCategory) {
      // Deselect if clicking the same category
      setSelectedCategoryState('');
    } else {
      setSelectedCategoryState(category);
    }
  };

  const {
    selectedTags,
    setSelectedTags,
    existingTags,
    toggleTag,
    clearTags,
    deleteTag
  } = useTags(entries, fetchEntries);

  const {
    playlistState,
    startPlaylist,
    stopPlaylist,
    nextVideo,
    previousVideo,
    getCurrentVideo
  } = usePlaylist();

  const {
    showForm,
    showQuickNote,
    showIdeaForm,
    showJournalForm,
    editingEntry,
    entryMode,
    handleCreateIdea,
    handleCreateQuickNote,
    handleCreateJournal,
    handleCreateFlashCard,
    handleEditEntry,
    handleCloseForm
  } = useFormManagement(setSelectedCategory);

  const {
    showCategoryManagement,
    setShowCategoryManagement,
    deleteConfirm,
    showSplash,
    setShowSplash,
    handleDelete,
    handleCancelDelete
  } = useModalManagement();

  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const savedViewMode = localStorage.getItem('viewMode') as ViewMode;
    if (savedViewMode) return savedViewMode;
    return window.innerWidth < 768 ? 'line' : 'row';
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [youtubeSettings, setYoutubeSettings] = useState<YouTubeSettings>({
    autoAddChannelAsTag: true
  });
  const [runTour, setRunTour] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<Entry | null>(null);
  const [interfacePreferences, setInterfacePreferences] = useState<InterfacePreferences>(() => {
    const savedPreferences = localStorage.getItem('interfacePreferences');
    if (savedPreferences) {
      const parsed = JSON.parse(savedPreferences);
      return {
        ...parsed,
        showFlashCards: false,
        showCategories: parsed.showCategories ?? true,
        showTags: parsed.showTags ?? true
      };
    }
    return {
      showQuickNotes: true,
      showIdeas: true,
      showFlashCards: false,
      showYouTube: true,
      showJournal: true,
      showCategories: true,
      showTags: true
    };
  });

  const filteredEntries = useEntryFiltering(
    entries,
    searchQuery,
    selectedCategory,
    selectedTags,
    showAllEntries
  );

  useEffect(() => {
    const savedViewMode = localStorage.getItem('viewMode') as ViewMode;
    if (!savedViewMode) {
      const defaultMode = window.innerWidth < 768 ? 'line' : 'row';
      setViewMode(defaultMode);
      localStorage.setItem('viewMode', defaultMode);
    }
    
    const handleResize = () => {
      if (!localStorage.getItem('viewMode')) {
        const newMode = window.innerWidth < 768 ? 'line' : 'row';
        setViewMode(newMode);
        localStorage.setItem('viewMode', newMode);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const savedYoutubeSettings = localStorage.getItem('youtubeSettings');
    if (savedYoutubeSettings) {
      try {
        setYoutubeSettings(JSON.parse(savedYoutubeSettings));
      } catch (error) {
        console.error('Error parsing YouTube settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('viewMode', viewMode);
  }, [viewMode]);
  
  useEffect(() => {
    localStorage.setItem('youtubeSettings', JSON.stringify(youtubeSettings));
  }, [youtubeSettings]);

  useEffect(() => {
    localStorage.setItem('interfacePreferences', JSON.stringify(interfacePreferences));
  }, [interfacePreferences]);

  const createGettingStartedEntry = async (userId: string) => {
    try {
      const { data: existingEntries, error: fetchError } = await supabase
        .from('entries')
        .select('*')
        .eq('title', 'Getting Started with On Mind')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;

      if (!existingEntries || existingEntries.length === 0) {
        const gettingStartedEntry = {
          title: "Getting Started with On Mind",
          content: "Welcome to On Mind! Here's how to get started:\n\n1. Add entries using the + button\n2. Quick notes can be added with the note icon\n3. Organize with categories and tags\n4. Use the search bar to find entries\n5. Toggle between different views (card, row, line)\n6. Star important entries and pin them to the top",
          explanation: "This entry demonstrates the core features of On Mind. You can:\n- Use different view modes\n- Organize with categories and tags\n- Add rich content with explanations\n- Save and watch YouTube videos\n- Export your knowledge base\n- Add URLs in the explanation area that automatically become clickable links (like https://example.com)\n\nTip: Click the help icon in the top bar to take a guided tour!",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          category: "Main",
          tags: ["Sample", "Tutorial"],
          is_favorite: true,
          is_pinned: true,
          user_id: userId
        };

        await createEntry(gettingStartedEntry);
      }
    } catch (error) {
      console.error('Error creating Getting Started entry:', error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        createGettingStartedEntry(newUser.id);
        fetchEntries();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        fetchEntries();
      }
    });

    const hasVisited = localStorage.getItem('hasVisited');
    if (!hasVisited) {
      localStorage.setItem('hasVisited', 'true');
      setRunTour(true);
    }

    return () => subscription.unsubscribe();
  }, [fetchEntries]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

  const handleSubmit = async (data: Partial<Entry>) => {
    try {
      if (editingEntry) {
        const success = await updateEntry(editingEntry.id, data);
        if (success) {
          handleCloseForm();
        }
      } else {
        if (entryMode === 'idea') {
          data.category = 'Ideas';
          data.tags = ['idea', ...(data.tags || [])];
        } else if (entryMode === 'journal') {
          data.category = 'Journal';
          data.tags = ['journal', ...(data.tags || [])];
        }
        
        const success = await createEntry({ ...data, user_id: user?.id });
        if (success) {
          handleCloseForm();
        }
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save entry');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.entryId) return;

    const success = await deleteEntry(deleteConfirm.entryId);
    if (success) {
      handleCancelDelete();
    }
  };

  const handleToggleExpand = (entryId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };
  
  const handleUpdateYoutubeSettings = (settings: YouTubeSettings) => {
    setYoutubeSettings(settings);
    toast.success('YouTube settings updated');
  };

  const handleUpdateInterfacePreferences = (preferences: InterfacePreferences) => {
    const enabledCount = Object.entries(preferences).reduce((count, [key, value]) => {
      if (key !== 'showYouTube' && key !== 'showCategories' && key !== 'showTags' && value) {
        return count + 1;
      }
      return count;
    }, 0);

    if (enabledCount > 3) {
      toast.error('Maximum 3 buttons allowed');
      return;
    }

    setInterfacePreferences(preferences);
    toast.success('Interface preferences updated');
  };

  const handleShowDetails = (entry: Entry) => {
    handleEditEntry(entry);
  };

  const handlePlayVideo = (entry: Entry) => {
    setCurrentVideo(entry);
    scrollToTop();
  };

  const handlePlayTagAsPlaylist = (tag: string, videos: Entry[]) => {
    startPlaylist(videos);
    if (videos.length > 0) {
      setCurrentVideo(videos[0]);
      scrollToTop();
    }
  };

  const handleReloadApp = () => {
    window.location.reload();
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags([tag]);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setSelectedTags([]);
  };

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  if (!user) {
    return <AuthView onSuccess={() => fetchEntries()} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2d1b69] to-[#1a1a1a] text-white">
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        styles={{
          options: {
            primaryColor: '#2d9edb',
            zIndex: 1000,
            overlayColor: 'rgba(26, 26, 26, 0.85)',
            backgroundColor: 'rgba(26, 26, 26, 0.95)',
            arrowColor: 'rgba(26, 26, 26, 0.95)',
            textColor: '#fff',
          },
          tooltip: {
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            background: 'linear-gradient(135deg, rgba(45, 27, 105, 0.95) 0%, rgba(26, 26, 26, 0.95) 100%)',
          },
          tooltipContainer: {
            textAlign: 'left'
          },
          buttonNext: {
            backgroundColor: '#2d9edb',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '14px',
          },
          buttonBack: {
            color: 'rgba(255, 255, 255, 0.6)',
            marginRight: '8px',
          },
          buttonSkip: {
            color: 'rgba(255, 255, 255, 0.6)',
          },
          buttonClose: {
            color: 'rgba(255, 255, 255, 0.6)',
          }
        }}
        callback={handleJoyrideCallback}
      />
      
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      <Header
        user={user}
        onSignOut={handleSignOut}
        onStartTour={() => setRunTour(true)}
        onOpenSettings={() => setShowCategoryManagement(true)}
        onReloadApp={handleReloadApp}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <VideoAccordion
          currentVideo={currentVideo}
          onClose={() => setCurrentVideo(null)}
          playlist={playlistState?.videos}
          currentIndex={playlistState?.currentIndex}
          onNextVideo={nextVideo}
          onPreviousVideo={previousVideo}
          interfacePreferences={interfacePreferences}
        />

        <div className="mb-6 space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
          />
          
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <EntryActions
                onCreateIdea={handleCreateIdea}
                onCreateQuickNote={handleCreateQuickNote}
                onCreateFlashCard={handleCreateFlashCard}
                onCreateJournal={handleCreateJournal}
                showAllEntries={showAllEntries}
                onToggleShowAll={() => {
                  setShowAllEntries(!showAllEntries);
                  if (!showAllEntries) {
                    setSelectedCategory('');
                    setSelectedTags([]);
                  }
                }}
                interfacePreferences={interfacePreferences}
              />

              <ViewModeToggle
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>

            <div className="bg-[#1a1a1a]/30 rounded-xl p-3 space-y-3">
              {interfacePreferences.showCategories && (
                <div className="categories-section">
                  <CategoryFilters
                    categories={allCategories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    entries={entries}
                    onDeleteCategory={deleteCategory}
                    onAddCategory={addCategory}
                    onRenameCategory={renameCategory}
                  />
                </div>
              )}
              
              {interfacePreferences.showTags && (
                <div className="tags-section">
                  <TagFilters
                    tags={existingTags}
                    selectedTags={selectedTags}
                    onToggleTag={toggleTag}
                    onClearAll={clearTags}
                    entries={entries}
                    selectedCategory={selectedCategory}
                    onDeleteTag={deleteTag}
                    onPlayTagAsPlaylist={handlePlayTagAsPlaylist}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {showForm && (
          <div className="mb-6">
            <EntryForm
              entry={editingEntry || undefined}
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
              existingCategories={existingCategories}
              existingTags={existingTags}
              youtubeSettings={youtubeSettings}
              mode={entryMode}
            />
          </div>
        )}

        {showQuickNote && (
          <div className="mb-6">
            <QuickNoteForm
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
              existingTags={existingTags}
            />
          </div>
        )}

        {showIdeaForm && (
          <div className="mb-6">
            <IdeaForm
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
              existingTags={existingTags}
            />
          </div>
        )}

        {showJournalForm && (
          <div className="mb-6">
            <JournalForm
              onSubmit={handleSubmit}
              onCancel={handleCloseForm}
              existingTags={existingTags}
            />
          </div>
        )}

        <EntryList
          entries={filteredEntries}
          loading={loading}
          showAllEntries={showAllEntries}
          viewMode={viewMode}
          expandedRows={expandedRows}
          onToggleExpand={handleToggleExpand}
          onEdit={handleEditEntry}
          onDelete={handleDelete}
          onToggleFavorite={toggleFavorite}
          onTogglePin={togglePin}
          onShowDetails={handleShowDetails}
          onPlayVideo={handlePlayVideo}
          onTagClick={handleTagClick}
          onCategoryClick={handleCategoryClick}
        />
      </main>

      <ConfirmDialog
        isOpen={deleteConfirm.show}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={handleCancelDelete}
      />

      <CategoryManagement
        isOpen={showCategoryManagement}
        onClose={() => setShowCategoryManagement(false)}
        existingCategories={existingCategories}
        entries={entries}
        onDeleteCategory={deleteCategory}
        youtubeSettings={youtubeSettings}
        onUpdateYoutubeSettings={handleUpdateYoutubeSettings}
        interfacePreferences={interfacePreferences}
        onUpdateInterfacePreferences={handleUpdateInterfacePreferences}
      />
    </div>
  );
}

export default App;