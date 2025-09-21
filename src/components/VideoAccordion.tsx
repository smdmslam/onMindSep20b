import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Play, SkipBack, SkipForward, Pause, Volume2, VolumeX, RefreshCw, Volume1, Volume, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import YouTube from 'react-youtube';
import type { Entry } from '../lib/firebase-client';
import { extractYouTubeVideoId, extractVimeoVideoId, getVideoPlatform } from '../lib/metadata';
import { formatTextWithLinks } from '../lib/utils';
import { VimeoPlayer, VimeoPlayerInstance } from './VimeoPlayer';
import { VimeoIframe } from './VimeoIframe';
import { INTRO_VIDEO } from '../lib/constants';

type VideoAccordionProps = {
  currentVideo: Entry | null;
  onClose: () => void;
  playlist?: Entry[];
  currentIndex?: number;
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
  onUpdateEntry?: (id: string, updates: Partial<Entry>) => Promise<boolean>;
  existingTags?: string[];
  onEntryUpdated?: (updatedEntry: Entry) => void;
  interfacePreferences?: {
    showQuickNotes: boolean;
    showIdeas: boolean;
    showFlashCards: boolean;
    showYouTube: boolean;
  };
};

export function VideoAccordion({
  currentVideo,
  onClose,
  playlist,
  currentIndex = 0,
  onNextVideo,
  onPreviousVideo,
  onUpdateEntry,
  existingTags = [],
  onEntryUpdated,
  interfacePreferences = {
    showQuickNotes: true,
    showIdeas: true,
    showFlashCards: true,
    showYouTube: true
  }
}: VideoAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Tag management state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Local video state to handle updates
  const [localVideo, setLocalVideo] = useState<Entry | null>(currentVideo);
  
  // Update local video when currentVideo changes
  useEffect(() => {
    setLocalVideo(currentVideo);
  }, [currentVideo]);
  
  // Determine which video to show - local video or intro video as fallback
  const displayVideo = localVideo || INTRO_VIDEO;
  const videoUrl = displayVideo.url || '';
  const videoPlatform = getVideoPlatform(videoUrl);
  const youtubeVideoId = videoPlatform === 'youtube' ? extractYouTubeVideoId(videoUrl) : null;
  const vimeoVideoId = videoPlatform === 'vimeo' ? extractVimeoVideoId(videoUrl) : null;

  // Debug logging (only once per video change)
  useEffect(() => {
    console.log('VideoAccordion Debug:', {
      showingIntroVideo: !currentVideo,
      videoUrl,
      videoPlatform,
      youtubeVideoId,
      vimeoVideoId,
      displayVideo: displayVideo.title,
      playlist: !!playlist,
      playlistLength: playlist?.length || 0,
      currentIndex
    });
  }, [currentVideo?.id, playlist?.length, currentIndex]);

  // Auto-expand when a video is selected or show intro by default
  useEffect(() => {
    if (currentVideo || displayVideo) {
      setIsExpanded(true);
    }
  }, [currentVideo, displayVideo]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (player && isPlaying) {
      progressInterval = setInterval(async () => {
        try {
          let currentTime = 0;
          let videoDuration = 0;

          if (videoPlatform === 'youtube') {
            currentTime = player.getCurrentTime();
            videoDuration = player.getDuration();
          } else if (videoPlatform === 'vimeo') {
            currentTime = await player.getCurrentTime();
            videoDuration = await player.getDuration();
          }

          if (videoDuration > 0) {
            setProgress((currentTime / videoDuration) * 100);
            setDuration(videoDuration);
          }
        } catch (error) {
          console.error('Error updating progress:', error);
        }
      }, 1000);
    }
    return () => clearInterval(progressInterval);
  }, [player, isPlaying, videoPlatform]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded && !currentVideo) {
      onClose();
    }
  };

  const handleReady = (event: any) => {
    console.log('🎬 Player ready!', {
      platform: videoPlatform,
      event: !!event,
      target: !!event?.target,
      videoId: youtubeVideoId || vimeoVideoId
    });
    
    // For YouTube, the player is event.target, not the event itself
    const playerInstance = event.target;
    setPlayer(playerInstance);
    
    // Set initial duration based on platform
    if (videoPlatform === 'youtube') {
      setDuration(playerInstance.getDuration());
    } else if (videoPlatform === 'vimeo') {
      playerInstance.getDuration().then((duration: number) => {
        setDuration(duration);
      });
    }
  };

  const handleStateChange = (event: any) => {
    // YouTube specific state change
    console.log('YouTube player state change:', event.data);
    
    // Handle different player states
    switch (event.data) {
      case -1: // unstarted
        console.log('YouTube player: unstarted');
        break;
      case 0: // ended
        console.log('YouTube player: ended');
        if (onNextVideo) {
          onNextVideo();
        }
        break;
      case 1: // playing
        console.log('YouTube player: playing');
        setIsPlaying(true);
        break;
      case 2: // paused
        console.log('YouTube player: paused');
        setIsPlaying(false);
        break;
      case 3: // buffering
        console.log('YouTube player: buffering');
        break;
      case 5: // video cued
        console.log('YouTube player: video cued');
        break;
    }
  };

  const handleVimeoPlay = () => {
    setIsPlaying(true);
  };

  const handleVimeoPause = () => {
    setIsPlaying(false);
  };

  const handleVimeoEnd = () => {
    if (onNextVideo) {
      onNextVideo();
    }
  };

  const handlePlayPause = async () => {
    console.log('🎮 Play/Pause button clicked!', {
      hasPlayer: !!player,
      isPlaying,
      videoPlatform,
      youtubeVideoId,
      vimeoVideoId
    });
    
    if (!player) {
      console.error('❌ No player instance available');
      return;
    }

    try {
      if (videoPlatform === 'youtube') {
        console.log('🎬 YouTube player control:', isPlaying ? 'PAUSING' : 'PLAYING');
        if (isPlaying) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      } else if (videoPlatform === 'vimeo') {
        console.log('🎬 Vimeo player control:', isPlaying ? 'PAUSING' : 'PLAYING');
        if (isPlaying) {
          await player.pause();
        } else {
          await player.play();
        }
      }
    } catch (error) {
      console.error('❌ Error controlling playback:', error);
    }
  };

  const handleToggleMute = async () => {
    if (!player) return;

    try {
      if (videoPlatform === 'youtube') {
        if (isMuted) {
          player.unMute();
          player.setVolume(volume);
        } else {
          player.mute();
        }
      } else if (videoPlatform === 'vimeo') {
        if (isMuted) {
          await player.setVolume(volume / 100);
        } else {
          await player.setVolume(0);
        }
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    
    if (player) {
      try {
        if (videoPlatform === 'youtube') {
          player.setVolume(newVolume);
          if (isMuted && newVolume > 0) {
            player.unMute();
            setIsMuted(false);
          }
        } else if (videoPlatform === 'vimeo') {
          await player.setVolume(newVolume / 100);
          if (isMuted && newVolume > 0) {
            setIsMuted(false);
          }
        }
      } catch (error) {
        console.error('Error changing volume:', error);
      }
    }
    setVolume(newVolume);
  };

  const handleReload = () => {
    if (player && videoPlatform === 'youtube' && youtubeVideoId) {
      try {
        const currentTime = player.getCurrentTime();
        player.loadVideoById(youtubeVideoId, currentTime);
      } catch (error) {
        console.error('Error reloading video:', error);
      }
    }
    // Vimeo doesn't have a direct reload method, would need to recreate the player
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={20} />;
    if (volume < 33) return <Volume size={20} />;
    if (volume < 67) return <Volume1 size={20} />;
    return <Volume2 size={20} />;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Don't render if YouTube integration is disabled
  if (!interfacePreferences.showYouTube) {
    return null;
  }

  // Always show the video player (with intro video as fallback)
  const showingIntroVideo = !currentVideo;

  // Tag management functions
  const handleAddTagClick = () => {
    setIsAddingTag(true);
    setNewTagInput('');
    setFilteredSuggestions([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleTagInputChange = (value: string) => {
    setNewTagInput(value);
    if (value.trim()) {
      const suggestions = existingTags
        .filter(tag => 
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !(displayVideo.tags || []).includes(tag)
        )
        .slice(0, 5);
      setFilteredSuggestions(suggestions);
    } else {
      setFilteredSuggestions([]);
    }
  };

  const handleAddTag = async (tagToAdd: string) => {
    if (!currentVideo || !onUpdateEntry || !tagToAdd.trim()) return;
    
    const trimmedTag = tagToAdd.trim();
    const currentTags = displayVideo.tags || [];
    if (currentTags.includes(trimmedTag)) {
      toast.error('Tag already exists');
      return;
    }

    try {
      const updatedTags = [...currentTags, trimmedTag];
      const success = await onUpdateEntry(currentVideo.id, { tags: updatedTags });
      
      if (success) {
        // Update local video state immediately
        if (localVideo) {
          const updatedVideo = { ...localVideo, tags: updatedTags };
          setLocalVideo(updatedVideo);
          onEntryUpdated?.(updatedVideo);
        }
        
        toast.success('Tag added successfully');
        setIsAddingTag(false);
        setNewTagInput('');
        setFilteredSuggestions([]);
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!currentVideo || !onUpdateEntry) return;

    try {
      const updatedTags = (displayVideo.tags || []).filter(tag => tag !== tagToRemove);
      const success = await onUpdateEntry(currentVideo.id, { tags: updatedTags });
      
      if (success) {
        // Update local video state immediately
        if (localVideo) {
          const updatedVideo = { ...localVideo, tags: updatedTags };
          setLocalVideo(updatedVideo);
          onEntryUpdated?.(updatedVideo);
        }
        
        toast.success('Tag removed successfully');
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Failed to remove tag');
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        handleAddTag(filteredSuggestions[0]);
      } else if (newTagInput.trim()) {
        handleAddTag(newTagInput);
      }
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setNewTagInput('');
      setFilteredSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleAddTag(suggestion);
  };

  return (
    <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-xl mb-6 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <Play size={20} className={showingIntroVideo ? "text-white/60" : "text-[#2d9edb]"} />
          <span className={showingIntroVideo ? "text-white/60" : "text-white"}>
            {showingIntroVideo ? (
              "On Mind Video Player - App Introduction"
            ) : playlist ? (
              <>
                Playing {currentIndex + 1} of {playlist.length}
                {playlist[currentIndex]?.tags.length > 0 && (
                  <span className="ml-2 text-white/60">
                    from tag: {playlist[currentIndex].tags[0]}
                  </span>
                )}
              </>
            ) : (
              displayVideo.title
            )}
          </span>
        </button>
        <button
          onClick={handleToggle}
          className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      <div className={`transition-all duration-300 ${isExpanded ? 'max-h-[800px]' : 'max-h-0'} overflow-hidden`}>
        <div className="relative pt-[56.25%] bg-black">
          {youtubeVideoId && (
            <YouTube
              videoId={youtubeVideoId}
              className="absolute inset-0"
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: showingIntroVideo ? 0 : 1, // Don't autoplay intro video
                  modestbranding: 1,
                  rel: 0,
                  controls: 0,
                  showinfo: 0,
                  fs: 1
                }
              }}
              onReady={handleReady}
              onStateChange={handleStateChange}
            />
          )}
          {vimeoVideoId && (
            <VimeoIframe
              videoId={vimeoVideoId}
              autoplay={!showingIntroVideo} // Don't autoplay intro video
              loop={showingIntroVideo} // Loop the intro video
              muted={false}
              controls={false}
            />
          )}
          {/* Fallback for when no video platform is detected */}
          {!youtubeVideoId && !vimeoVideoId && videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white/60 text-center">
                <p>Unsupported video platform</p>
                <p className="text-sm mt-2">{videoUrl}</p>
                <a 
                  href={videoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#2d9edb] hover:underline text-sm mt-2 block"
                >
                  Open video in new tab
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Custom Video Controls */}
        <div className="p-4 space-y-4">
          {/* Progress Bar */}
          <div className="relative h-2 bg-white/20 rounded-full group cursor-pointer">
            <div 
              className="absolute h-full bg-[#2d9edb] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            <div 
              className="absolute h-4 w-4 bg-[#2d9edb] rounded-full -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  console.log('⏮️ Previous button clicked!', {
                    hasFunction: !!onPreviousVideo,
                    playlist: !!playlist,
                    currentIndex,
                    playlistLength: playlist?.length || 0
                  });
                  if (onPreviousVideo) {
                    onPreviousVideo();
                  }
                }}
                disabled={!onPreviousVideo}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous video (Left Arrow)"
              >
                <SkipBack size={20} />
              </button>
              
              <button
                onClick={() => {
                  console.log('🔥 BUTTON CLICKED - This should always show!');
                  handlePlayPause();
                }}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Play/Pause (Space)"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button
                onClick={() => {
                  console.log('⏭️ Next button clicked!', {
                    hasFunction: !!onNextVideo,
                    playlist: !!playlist,
                    currentIndex,
                    playlistLength: playlist?.length || 0
                  });
                  if (onNextVideo) {
                    onNextVideo();
                  }
                }}
                disabled={!onNextVideo}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next video (Right Arrow)"
              >
                <SkipForward size={20} />
              </button>
              
              <button
                onClick={handleReload}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Reload video"
              >
                <RefreshCw size={20} />
              </button>

              {duration > 0 && (
                <span className="text-sm text-white/60">
                  {formatTime(player?.getCurrentTime() || 0)} / {formatTime(duration)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleMute}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Toggle mute (M)"
                >
                  {getVolumeIcon()}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  title="Volume (Up/Down Arrow)"
                />
              </div>
            </div>
          </div>

          {/* Video Title and Description */}
          <div className="pt-2 border-t border-white/10">
            <h3 className="text-lg text-white font-medium mb-2">
              {displayVideo.title}
            </h3>
            
            {/* Channel Info - Extract from tags if available */}
            {!showingIntroVideo && displayVideo.tags && displayVideo.tags.length > 0 && (
              <div className="text-sm text-white/60 mb-2">
                Video by {displayVideo.tags.find(tag => 
                  tag.toLowerCase().includes('cooking') || 
                  tag.toLowerCase().includes('channel') ||
                  tag === displayVideo.tags[0] // Fallback to first tag as potential channel
                ) || displayVideo.tags[0]}
              </div>
            )}
            
            {displayVideo.explanation && (
              <div className="text-sm text-white/60 mb-3">
                {formatTextWithLinks(displayVideo.explanation)}
              </div>
            )}
            
            {/* Video Tags */}
            {!showingIntroVideo && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-1.5 items-center">
                  {displayVideo.tags && displayVideo.tags.map((tag, index) => (
                    <div
                      key={index}
                      className="group relative px-2 py-1 text-xs bg-blue-500/10 text-blue-300/80 hover:bg-blue-500/20 hover:text-blue-200 border border-blue-400/30 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                      title={`Filter by ${tag}`}
                    >
                      <span>{tag}</span>
                      {currentVideo && onUpdateEntry && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTag(tag);
                          }}
                          className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 hover:bg-red-400/20 rounded-full transition-all"
                          title="Remove tag"
                        >
                          <X size={10} className="text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Add Tag Button or Input */}
                  {currentVideo && onUpdateEntry && (
                    <div className="relative">
                      {!isAddingTag ? (
                        <button
                          onClick={handleAddTagClick}
                          className="px-2 py-1 text-xs bg-blue-500/10 text-blue-300/80 hover:bg-blue-500/20 hover:text-blue-200 border border-blue-400/30 rounded-full transition-colors cursor-pointer flex items-center gap-1"
                          title="Add tag"
                        >
                          +
                        </button>
                      ) : (
                        <div className="relative">
                          <input
                            ref={inputRef}
                            type="text"
                            value={newTagInput}
                            onChange={(e) => handleTagInputChange(e.target.value)}
                            onKeyDown={handleTagInputKeyDown}
                            onBlur={() => {
                              // Delay to allow suggestion click
                              setTimeout(() => {
                                setIsAddingTag(false);
                                setNewTagInput('');
                                setFilteredSuggestions([]);
                              }, 150);
                            }}
                            className="px-2 py-1 text-xs bg-blue-500/10 text-blue-200 border border-blue-400/50 rounded-full focus:outline-none focus:border-blue-400 min-w-[100px]"
                            placeholder="Add tag..."
                          />
                          
                          {/* Tag Suggestions */}
                          {filteredSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 mt-1 bg-[#1a1a1a] border border-white/20 rounded-lg shadow-lg z-10 min-w-[150px]">
                              {filteredSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="block w-full px-3 py-2 text-xs text-white/80 hover:bg-white/10 text-left first:rounded-t-lg last:rounded-b-lg transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {showingIntroVideo && (
              <div className="mt-3 p-3 bg-[#2d9edb]/10 border border-[#2d9edb]/20 rounded-lg">
                <p className="text-sm text-[#2d9edb]">
                  👋 Welcome! This is your introduction to On Mind. Click play to learn about all the features available to you.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}