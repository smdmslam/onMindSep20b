import React, { useState, useEffect } from 'react';
import { X, Youtube, Loader2, Star, Pin, Globe } from 'lucide-react';
import type { Entry } from '../lib/firebase-client';
import { TagInput } from './TagInput';
import { fetchUrlMetadata, extractYouTubeVideoId } from '../lib/metadata';
import { toast } from 'react-hot-toast';
import { DEFAULT_CATEGORIES } from '../lib/constants';

type QuickNoteFormProps = {
  onSubmit: (data: Partial<Entry>) => void;
  onCancel: () => void;
  existingCategories: string[];
  existingTags: string[];
  entry?: Entry;
  youtubeSettings?: {
    autoAddChannelAsTag: boolean;
  };
};

export function QuickNoteForm({ 
  onSubmit, 
  onCancel, 
  existingCategories,
  existingTags,
  entry,
  youtubeSettings = { autoAddChannelAsTag: true }
}: QuickNoteFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: '',
    category: 'General',
    explanation: '',
    tags: 'Quick Note', // Initialize with Quick Note tag
    is_favorite: false,
    is_pinned: false
  });
  const [fetchMetadata, setFetchMetadata] = useState(false);
  const [fetchWebMetadata, setFetchWebMetadata] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [lastProcessedUrl, setLastProcessedUrl] = useState('');
  const [isYouTubeUrl, setIsYouTubeUrl] = useState(false);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);

  // Find the YouTube category from DEFAULT_CATEGORIES to ensure consistent casing
  const youTubeCategory = DEFAULT_CATEGORIES.find(cat => cat.toLowerCase() === 'youtube') || 'YouTube';
  
  // Combine default and custom categories
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();

  // Initialize form with entry data when editing
  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        content: entry.content,
        url: entry.url || '',
        category: entry.category,
        explanation: entry.explanation || '',
        tags: entry.tags.filter(tag => tag !== 'Quick Note').join(', '), // Remove Quick Note tag for display
        is_favorite: entry.is_favorite,
        is_pinned: entry.is_pinned
      });
      
      // Show advanced fields if entry has non-default category or explanation
      if (entry.category !== 'Quick Note' || entry.explanation) {
        setShowAdvancedFields(true);
      }
    }
  }, [entry]);

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
        (fetchMetadata || fetchWebMetadata) && 
        formData.url && 
        formData.url !== lastProcessedUrl
      ) {
        setIsLoadingMetadata(true);
        
        try {
          const metadata = await fetchUrlMetadata(formData.url);
          setLastProcessedUrl(formData.url);
          
          if (metadata.success && metadata.title) {
            setFormData(prev => ({
              ...prev,
              title: metadata.title || prev.title,
              content: metadata.description ? `${metadata.description}\n\nSource: ${formData.url}` : prev.content
            }));
            
            // Handle YouTube specific metadata
            if (isYouTubeUrl && metadata.channelName && youtubeSettings.autoAddChannelAsTag) {
              setChannelName(metadata.channelName);
              addChannelNameToTags(metadata.channelName, formData.tags);
            }
            
            toast.success(isYouTubeUrl ? 'YouTube video details loaded' : 'Article details loaded');
          }
        } catch (error) {
          console.error('Error in metadata fetch:', error);
          toast.error('Failed to fetch page details');
        } finally {
          setIsLoadingMetadata(false);
        }
      }
    };

    fetchMetadataFromUrl();
  }, [formData.url, fetchMetadata, fetchWebMetadata, lastProcessedUrl, isYouTubeUrl, youtubeSettings.autoAddChannelAsTag]);

  const addChannelNameToTags = (channel: string, currentTags: string | string[]) => {
    if (!channel) return;
    
    // Convert current tags to array if it's a string
    const tagList = Array.isArray(currentTags) 
      ? currentTags 
      : currentTags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    // Ensure Quick Note tag is present
    if (!tagList.includes('Quick Note')) {
      tagList.unshift('Quick Note');
    }
    
    // Check if channel is already in tags
    if (!tagList.includes(channel)) {
      const newTags = [...tagList, channel].join(', ');
      
      setFormData(prev => ({
        ...prev,
        tags: newTags
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a copy of the form data for submission
    const submissionData = { ...formData };
    
    // Convert tags to array, handling both string and array input
    const tags = Array.isArray(submissionData.tags)
      ? submissionData.tags
      : submissionData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    // Ensure Quick Note tag is present
    if (!tags.includes('Quick Note')) {
      tags.unshift('Quick Note');
    }
    
    // If channel name exists and auto-add setting is enabled AND auto-fill is checked, ensure it's in the tags
    if (channelName && youtubeSettings.autoAddChannelAsTag && fetchMetadata) {
      if (!tags.includes(channelName)) {
        tags.push(channelName);
      }
    }
    
    onSubmit({
      title: submissionData.title,
      content: submissionData.content || ' ', // Provide a space if content is empty
      url: submissionData.url,
      category: fetchMetadata && isYouTubeUrl ? youTubeCategory : submissionData.category, // Use YouTube category if auto-fill is enabled, otherwise use selected category
      explanation: submissionData.explanation || null,
      tags: tags,
      is_favorite: submissionData.is_favorite,
      is_pinned: submissionData.is_pinned,
    });
  };

  // Check if channel name is already in tags
  const isChannelInTags = channelName ? 
    (Array.isArray(formData.tags) 
      ? formData.tags.includes(channelName)
      : formData.tags.split(',').map(tag => tag.trim()).includes(channelName))
    : false;

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a]/50 border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-white">Quick Note</h3>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_favorite: !prev.is_favorite }))}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                formData.is_favorite ? 'text-yellow-400' : 'text-white/60'
              }`}
            >
              <Star size={18} />
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, is_pinned: !prev.is_pinned }))}
              className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${
                formData.is_pinned ? 'text-[#2d9edb]' : 'text-white/60'
              }`}
            >
              <Pin size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowAdvancedFields(!showAdvancedFields)}
            className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={showAdvancedFields ? "Hide advanced fields" : "Show advanced fields"}
          >
            {showAdvancedFields ? 'Show Less' : 'Show More'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      <div className="mb-3">
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
          placeholder="Title"
          required
        />
      </div>

      <div className="mb-3">
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50 resize-none"
          placeholder="Content"
          rows={3}
        />
      </div>

      {/* Advanced Fields - Category and Explanation */}
      {showAdvancedFields && (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-white/60 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
            >
              {allCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium text-white/60 mb-1">
              Explanation (optional)
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50 resize-none"
              placeholder="Additional explanation or notes"
              rows={2}
            />
          </div>
        </>
      )}

      <div className="mb-3">
        <div className="flex gap-2">
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#2d9edb]/50"
            placeholder="URL (optional)"
          />
          <div className="flex items-center gap-2">
            {isYouTubeUrl ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg youtube-autofill">
                <input
                  type="checkbox"
                  id="fetchMetadata"
                  checked={fetchMetadata}
                  onChange={(e) => {
                    setFetchMetadata(e.target.checked);
                    if (e.target.checked) setFetchWebMetadata(false);
                  }}
                  className="w-4 h-4 rounded bg-black/50 border-white/30 text-[#2d9edb] focus:ring-[#2d9edb]/50"
                />
                <label 
                  htmlFor="fetchMetadata" 
                  className="text-sm cursor-pointer text-white flex items-center gap-1"
                  title="Auto-fill from YouTube"
                >
                  <Youtube size={14} className="text-[#2d9edb]" />
                  Auto-fill
                </label>
              </div>
            ) : formData.url && (
              <div className="flex items-center gap-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg">
                <input
                  type="checkbox"
                  id="fetchWebMetadata"
                  checked={fetchWebMetadata}
                  onChange={(e) => {
                    setFetchWebMetadata(e.target.checked);
                    if (e.target.checked) setFetchMetadata(false);
                  }}
                  className="w-4 h-4 rounded bg-black/50 border-white/30 text-[#2d9edb] focus:ring-[#2d9edb]/50"
                />
                <label 
                  htmlFor="fetchWebMetadata" 
                  className="text-sm cursor-pointer text-white flex items-center gap-1"
                  title="Auto-fill from webpage"
                >
                  <Globe size={14} className="text-[#2d9edb]" />
                  Auto-fill
                </label>
              </div>
            )}
            {isLoadingMetadata && (
              <div className="p-2">
                <Loader2 size={20} className="animate-spin text-[#2d9edb]" />
              </div>
            )}
          </div>
        </div>
        {channelName && youtubeSettings.autoAddChannelAsTag && fetchMetadata && (
          <p className="mt-1 text-xs text-green-400">
            Channel "{channelName}" {isChannelInTags ? 'has been added as a tag' : 'will be added as a tag'}
          </p>
        )}
        {fetchMetadata && isYouTubeUrl && (
          <p className="mt-1 text-xs text-[#2d9edb]">
            Entry will be saved in the YouTube category
          </p>
        )}
      </div>

      <div className="mb-4">
        <TagInput
          value={formData.tags}
          onChange={(value) => setFormData({ ...formData, tags: Array.isArray(value) ? value.join(', ') : value })}
          existingTags={existingTags}
        />
        <p className="mt-1 text-xs text-white/40">
          Tags (optional, comma-separated). "Quick Note" tag will be automatically added.
          {channelName && youtubeSettings.autoAddChannelAsTag && fetchMetadata && !isChannelInTags && (
            <> Channel "{channelName}" will be added as a tag when you save.</>
          )}
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-[#2d9edb] text-white rounded-lg hover:bg-[#2d9edb]/90 transition-colors"
        >
          Save Note
        </button>
      </div>
    </form>
  );
}