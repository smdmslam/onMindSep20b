import React, { useState, useRef, useEffect } from 'react';
import { X, Youtube, Loader2, Star, Pin, Tag, RefreshCw, SmilePlus, Smile, Meh, Frown, Frown as FrownPlus, Calendar } from 'lucide-react';
import type { Entry } from '../lib/firebase-client';
import { DEFAULT_CATEGORIES } from '../lib/constants';
import { TagInput } from './TagInput';
import { fetchUrlMetadata, extractYouTubeVideoId } from '../lib/metadata';
import { toast } from 'react-hot-toast';

type EntryFormProps = {
  entry?: Entry;
  onSubmit: (data: Partial<Entry>) => void;
  onCancel: () => void;
  existingCategories: string[];
  existingTags: string[];
  youtubeSettings?: {
    autoAddChannelAsTag: boolean;
  };
  mode?: 'idea' | 'quick' | 'flash' | 'journal';
};

type Mood = 'joyful' | 'calm' | 'anxious' | 'sad' | 'angry';

export function EntryForm({ 
  entry, 
  onSubmit, 
  onCancel, 
  existingCategories, 
  existingTags,
  youtubeSettings = { autoAddChannelAsTag: true },
  mode = 'flash'
}: EntryFormProps) {
  // Find the YouTube category from DEFAULT_CATEGORIES to ensure consistent casing
  const youTubeCategory = DEFAULT_CATEGORIES.find(cat => cat.toLowerCase() === 'youtube') || 'YouTube';

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    explanation: '',
    url: '',
    category: mode === 'flash' ? 'Flash Card' : mode === 'idea' ? 'Ideas' : mode === 'journal' ? 'Journal' : DEFAULT_CATEGORIES[0],
    tags: mode === 'flash' ? ['Flash Card'] : mode === 'idea' ? ['idea'] : mode === 'journal' ? ['Journal'] : [],
    mood: '' as Mood,
    customDate: new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDThh:mm
  });

  const [fetchMetadata, setFetchMetadata] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [lastProcessedUrl, setLastProcessedUrl] = useState('');
  const [isYouTubeUrl, setIsYouTubeUrl] = useState(false);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const explanationTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Journal prompts
  const journalPrompts = [
    "What's the most meaningful thing that happened today?",
    "What are you grateful for right now?",
    "What's something you learned today?",
    "What's a challenge you faced and how did you handle it?",
    "What are your goals for tomorrow?",
    "How are you feeling and why?",
    "What's something you're looking forward to?",
    "What's a memory from today you want to remember?",
    "What gave you energy today?",
    "Did anything surprise you today?",
  ];

  // Using Lucide face icons for moods with updated colors
  const moodIcons = {
    joyful: <SmilePlus size={16} className="text-[#FFD93D]" />, // Warm Yellow
    calm: <Smile size={16} className="text-[#6DD3CE]" />, // Soft Teal
    anxious: <Meh size={16} className="text-[#F4A261]" />, // Muted Orange
    sad: <Frown size={16} className="text-[#4A4E69]" />, // Cool Blue
    angry: <FrownPlus size={16} className="text-[#D7263D]" /> // Deep Red
  };

  const moodLabels = {
    joyful: 'Joyful - Energetic, happy, optimistic',
    calm: 'Calm - Peaceful, grounded, relaxed',
    anxious: 'Anxious - Uneasy, alert, unsettled',
    sad: 'Sad - Reflective, melancholy',
    angry: 'Angry - Intense, passionate, frustrated'
  };

  useEffect(() => {
    if (entry) {
      // Extract mood from tags if present
      const moodTag = entry.tags.find(tag => tag.startsWith('mood:'));
      const mood = moodTag ? moodTag.split(':')[1] as Mood : '';

      // Set form data including mood
      setFormData({
        title: entry.title,
        content: entry.content.replace(/^Mood: .*\n---\n/, ''), // Remove mood metadata
        explanation: entry.explanation || '',
        url: entry.url || '',
        category: entry.category,
        tags: entry.tags.filter(tag => !tag.startsWith('mood:')), // Remove mood tag
        mood,
        customDate: new Date(entry.created_at).toISOString().slice(0, 16)
      });
    }

    // Get random prompt for journal entries
    if (mode === 'journal') {
      const randomIndex = Math.floor(Math.random() * journalPrompts.length);
      setCurrentPrompt(journalPrompts[randomIndex]);
    }
  }, [entry, mode]);

  // Auto-resize textareas on initial load and when content changes
  useEffect(() => {
    adjustTextareaHeight(contentTextareaRef.current);
    adjustTextareaHeight(explanationTextareaRef.current);
  }, [formData.content, formData.explanation]);

  // Check if URL is YouTube when it changes
  useEffect(() => {
    const youtubeVideoId = extractYouTubeVideoId(formData.url);
    setIsYouTubeUrl(!!youtubeVideoId);
    
    // Reset channel name when URL changes
    if (formData.url !== lastProcessedUrl) {
      setChannelName(null);
    }
  }, [formData.url, lastProcessedUrl]);

  // Effect to fetch metadata when URL changes and checkbox is checked
  useEffect(() => {
    const fetchMetadataFromUrl = async () => {
      if (
        fetchMetadata && 
        formData.url && 
        formData.url !== lastProcessedUrl && 
        isYouTubeUrl
      ) {
        setIsLoadingMetadata(true);
        
        try {
          const metadata = await fetchUrlMetadata(formData.url);
          setLastProcessedUrl(formData.url);
          
          if (metadata.success && metadata.title) {
            setFormData(prev => ({
              ...prev,
              title: metadata.title || prev.title,
              explanation: metadata.description || prev.explanation,
              category: mode === 'flash' ? 'Flash Card' : youTubeCategory
            }));
            
            // Store channel name for potential tag use
            if (metadata.channelName) {
              setChannelName(metadata.channelName);
              
              // If auto-add channel as tag is enabled AND auto-fill is checked, add the channel name to tags
              if (youtubeSettings.autoAddChannelAsTag && fetchMetadata) {
                const newTags = [...formData.tags];
                if (!newTags.includes(metadata.channelName)) {
                  newTags.push(metadata.channelName);
                }
                setFormData(prev => ({
                  ...prev,
                  tags: newTags
                }));
              }
            }
            
            toast.success('YouTube video details loaded');
          }
        } catch (error) {
          console.error('Error in metadata fetch:', error);
        } finally {
          setIsLoadingMetadata(false);
        }
      }
    };

    fetchMetadataFromUrl();
  }, [formData.url, fetchMetadata, lastProcessedUrl, isYouTubeUrl, youTubeCategory, youtubeSettings.autoAddChannelAsTag, mode]);

  const addChannelNameToTags = (channel: string) => {
    if (!channel) return;
    
    if (!formData.tags.includes(channel)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, channel]
      }));
    }
  };

  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a copy of the form data for submission
    const submissionData = { ...formData };
    
    // Ensure mode-specific tag is included
    if (mode === 'flash' && !submissionData.tags.includes('Flash Card')) {
      submissionData.tags.unshift('Flash Card');
    } else if (mode === 'journal' && !submissionData.tags.includes('Journal')) {
      submissionData.tags.unshift('Journal');
    }
    
    // Add mood tag if in journal mode and mood is selected
    if (mode === 'journal' && submissionData.mood) {
      submissionData.tags.push(`mood:${submissionData.mood}`);
    }
    
    // Format metadata for journal entries
    let content = submissionData.content;
    if (mode === 'journal' && submissionData.mood) {
      content = `Mood: ${submissionData.mood}\n---\n${content}`;
    }
    
    // If channel name exists and auto-add setting is enabled AND auto-fill is checked, ensure it's in the tags
    if (channelName && youtubeSettings.autoAddChannelAsTag && fetchMetadata) {
      if (!submissionData.tags.includes(channelName)) {
        submissionData.tags.push(channelName);
      }
    }
    
    onSubmit({
      title: submissionData.title,
      content: content || ' ', // Provide a space if content is empty
      explanation: submissionData.explanation,
      url: submissionData.url,
      category: submissionData.category,
      tags: submissionData.tags,
      created_at: mode === 'journal' ? new Date(submissionData.customDate).toISOString() : undefined
    });
  };

  const handleManualFetch = async () => {
    if (!formData.url) {
      toast.error('Please enter a URL');
      return;
    }

    if (!isYouTubeUrl) {
      toast.error('Auto-fill only works with YouTube URLs');
      return;
    }

    setIsLoadingMetadata(true);
    
    try {
      const metadata = await fetchUrlMetadata(formData.url);
      setLastProcessedUrl(formData.url);
      
      if (metadata.success && metadata.title) {
        setFormData(prev => ({
          ...prev,
          title: metadata.title || prev.title,
          explanation: metadata.description || prev.explanation,
          category: mode === 'flash' ? 'Flash Card' : youTubeCategory
        }));
        
        // Store channel name for potential tag use
        if (metadata.channelName) {
          setChannelName(metadata.channelName);
          
          // If auto-add channel as tag is enabled, add the channel name to tags
          if (youtubeSettings.autoAddChannelAsTag) {
            addChannelNameToTags(metadata.channelName);
          }
        }
        
        toast.success('YouTube video details loaded');
      } else {
        toast.error(metadata.error || 'Failed to fetch YouTube details');
      }
    } catch (error) {
      console.error('Error in manual metadata fetch:', error);
      toast.error('Failed to fetch YouTube details');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  // Function to adjust textarea height based on content
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to scrollHeight to fit the content
    textarea.style.height = `${textarea.scrollHeight}px`;
    
    // Set a minimum height
    if (textarea.scrollHeight < 80) {
      textarea.style.height = '80px';
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: 'content' | 'explanation') => {
    setFormData({ ...formData, [field]: e.target.value });
    adjustTextareaHeight(e.target);
  };

  const getNewPrompt = () => {
    let newPrompt = currentPrompt;
    while (newPrompt === currentPrompt) {
      const randomIndex = Math.floor(Math.random() * journalPrompts.length);
      newPrompt = journalPrompts[randomIndex];
    }
    setCurrentPrompt(newPrompt);
  };

  const usePrompt = () => {
    if (currentPrompt) {
      setFormData(prev => ({
        ...prev,
        content: prev.content + (prev.content ? '\n\n' : '') + `${currentPrompt}\n`
      }));
      getNewPrompt();
    }
  };

  // Check if channel name is already in tags
  const isChannelInTags = channelName ? formData.tags.includes(channelName) : false;

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a]/50 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          {mode === 'idea' ? 'Edit Idea' : 
           mode === 'quick' ? 'Edit Quick Note' : 
           mode === 'journal' ? 'Edit Journal Entry' : 
           'Edit Flash Card'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {mode === 'journal' && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-white/60 mb-2">
            Track your mood to unlock insights - See your 10-day emotional journey in Settings
          </label>
          <div className="flex flex-wrap gap-2">
            {(['joyful', 'calm', 'anxious', 'sad', 'angry'] as Mood[]).map(mood => (
              <button
                key={mood}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, mood }))}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                  formData.mood === mood
                    ? `bg-${mood === 'joyful' ? '[#FFD93D]' : 
                        mood === 'calm' ? '[#6DD3CE]' : 
                        mood === 'anxious' ? '[#F4A261]' : 
                        mood === 'sad' ? '[#4A4E69]' : 
                        '[#D7263D]'}/20 text-${
                        mood === 'joyful' ? '[#FFD93D]' : 
                        mood === 'calm' ? '[#6DD3CE]' : 
                        mood === 'anxious' ? '[#F4A261]' : 
                        mood === 'sad' ? '[#4A4E69]' : 
                        '[#D7263D]'}`
                    : 'bg-black/30 text-white/60 hover:bg-white/10'
                }`}
                title={moodLabels[mood]}
              >
                {moodIcons[mood]}
                <span className="text-xs">{mood.charAt(0).toUpperCase() + mood.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-white/60 mb-1">
          Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
          required
        />
      </div>

      {mode === 'journal' && currentPrompt && (
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 p-3 bg-[#2d9edb]/10 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[#2d9edb] mb-1">
                Writing Prompt
              </label>
              <p className="text-sm text-white/90">{currentPrompt}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={getNewPrompt}
                className="p-2 text-[#2d9edb] hover:bg-[#2d9edb]/20 rounded-lg transition-colors"
                title="Get another prompt"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={usePrompt}
                className="px-3 py-1.5 text-sm bg-[#2d9edb]/20 text-[#2d9edb] rounded-lg hover:bg-[#2d9edb]/30 transition-colors"
              >
                Use Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-white/60 mb-1">
          Content
        </label>
        <textarea
          ref={contentTextareaRef}
          value={formData.content}
          onChange={(e) => handleTextareaChange(e, 'content')}
          className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg font-mono text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50 resize-none overflow-hidden"
          style={{ minHeight: '80px' }}
          placeholder="Enter content (optional)"
        />
        {mode === 'journal' && (
          <div className="flex justify-end mt-2">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <span>{new Date(formData.customDate).toLocaleString()}</span>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="p-1 text-[#2d9edb] hover:bg-[#2d9edb]/20 rounded-lg transition-colors"
              >
                <Calendar size={14} />
              </button>
              <input
                type="datetime-local"
                value={formData.customDate}
                onChange={(e) => setFormData(prev => ({ ...prev, customDate: e.target.value }))}
                className={`bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-white/60 ${
                  showDatePicker ? 'block' : 'hidden'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {!mode && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-white/60 mb-1">
              URL (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com or https://youtube.com/watch?v=..."
                className="flex-1 px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
              />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg youtube-autofill">
                  <input
                    type="checkbox"
                    id="fetchMetadata"
                    checked={fetchMetadata}
                    onChange={(e) => setFetchMetadata(e.target.checked)}
                    className="w-4 h-4 rounded bg-black/50 border-white/30 text-[#2d9edb] focus:ring-[#2d9edb]/50"
                    disabled={!isYouTubeUrl}
                  />
                  <label 
                    htmlFor="fetchMetadata" 
                    className={`text-sm cursor-pointer ${isYouTubeUrl ? 'text-white' : 'text-white/30'}`}
                    title={isYouTubeUrl ? "Auto-fill from YouTube" : "Only works with YouTube URLs"}
                  >
                    Auto-fill from YouTube
                  </label>
                </div>
                <button
                  type="button"
                  onClick={handleManualFetch}
                  disabled={isLoadingMetadata || !formData.url || !isYouTubeUrl}
                  className="p-2 bg-[#2d9edb]/20 text-[#2d9edb] rounded-lg hover:bg-[#2d9edb]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={isYouTubeUrl ? "Fetch YouTube details" : "Only works with YouTube URLs"}
                >
                  {isLoadingMetadata ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Youtube size={18} />
                  )}
                </button>
              </div>
            </div>
            {isLoadingMetadata && (
              <p className="mt-1 text-xs text-white/40">Fetching YouTube details...</p>
            )}
            {!isYouTubeUrl && formData.url && fetchMetadata && (
              <p className="mt-1 text-xs text-amber-400">Auto-fill only works with YouTube URLs</p>
            )}
            {channelName && youtubeSettings.autoAddChannelAsTag && fetchMetadata && (
              <p className="mt-1 text-xs text-green-400">
                Channel "{channelName}" {isChannelInTags ? 'has been added as a tag' : 'will be added as a tag'}
              </p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-white/60 mb-1">
              Explanation
            </label>
            <textarea
              ref={explanationTextareaRef}
              value={formData.explanation}
              onChange={(e) => handleTextareaChange(e, 'explanation')}
              className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50 resize-none overflow-hidden"
              style={{ minHeight: '80px' }}
              placeholder="Enter explanation with line breaks for formatting"
            />
            <p className="mt-1 text-xs text-white/40">Use line breaks to format your text with bullet points or paragraphs</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-white/60 mb-1">
              Category
            </label>
            <div className="space-y-3">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
              >
                {allCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {mode === 'flash' && (
                <p className="text-xs text-white/40">
                  You can change the category, but the Flash Card tag will always be included
                </p>
              )}
            </div>
          </div>
        </>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-white/60 mb-1">
          Tags
        </label>
        <TagInput
          value={formData.tags}
          onChange={(tags) => setFormData({ ...formData, tags })}
          existingTags={existingTags}
        />
        {mode === 'flash' && (
          <p className="mt-1 text-xs text-white/40">
            "Flash Card" tag will be automatically added.
          </p>
        )}
        {mode === 'journal' && (
          <p className="mt-1 text-xs text-white/40">
            "Journal" tag will be automatically added.
          </p>
        )}
        {channelName && youtubeSettings.autoAddChannelAsTag && fetchMetadata && !isChannelInTags && (
          <p className="mt-1 text-xs text-green-400">Channel "{channelName}" will be added as a tag when you save</p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#2d9edb] text-white rounded-lg hover:bg-[#2d9edb]/90 transition-colors"
        >
          {entry ? 'Update' : 'Create'} Entry
        </button>
      </div>
    </form>
  );
}