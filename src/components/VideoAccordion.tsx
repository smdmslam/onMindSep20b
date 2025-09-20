import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Play, SkipBack, SkipForward, Pause, Volume2, VolumeX, RefreshCw, Volume1, Volume } from 'lucide-react';
import YouTube from 'react-youtube';
import type { Entry } from '../lib/supabase';
import { extractYouTubeVideoId } from '../lib/metadata';
import { formatTextWithLinks } from '../lib/utils';

type VideoAccordionProps = {
  currentVideo: Entry | null;
  onClose: () => void;
  playlist?: Entry[];
  currentIndex?: number;
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
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
  const videoId = currentVideo?.url ? extractYouTubeVideoId(currentVideo.url) : null;

  // Auto-expand when a video is selected
  useEffect(() => {
    if (currentVideo) {
      setIsExpanded(true);
    }
  }, [currentVideo]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (player && isPlaying) {
      progressInterval = setInterval(() => {
        const currentTime = player.getCurrentTime();
        const videoDuration = player.getDuration();
        setProgress((currentTime / videoDuration) * 100);
        setDuration(videoDuration);
      }, 1000);
    }
    return () => clearInterval(progressInterval);
  }, [player, isPlaying]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded && !currentVideo) {
      onClose();
    }
  };

  const handleReady = (event: any) => {
    setPlayer(event.target);
    setDuration(event.target.getDuration());
  };

  const handleStateChange = (event: any) => {
    if (event.data === 0 && onNextVideo) {
      onNextVideo();
    }
    setIsPlaying(event.data === 1);
  };

  const handlePlayPause = () => {
    if (player) {
      if (isPlaying) {
        player.pauseVideo();
      } else {
        player.playVideo();
      }
    }
  };

  const handleToggleMute = () => {
    if (player) {
      if (isMuted) {
        player.unMute();
        player.setVolume(volume);
      } else {
        player.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    if (player) {
      player.setVolume(newVolume);
      if (isMuted && newVolume > 0) {
        player.unMute();
        setIsMuted(false);
      }
    }
    setVolume(newVolume);
  };

  const handleReload = () => {
    if (player) {
      const currentTime = player.getCurrentTime();
      player.loadVideoById(videoId, currentTime);
    }
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

  if (!currentVideo) {
    return (
      <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-xl mb-6 overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={handleToggle}
            className="flex items-center gap-2 hover:text-white transition-colors"
          >
            <Play size={20} className="text-white/60" />
            <span className="text-white/60">On Mind Video Player</span>
          </button>
          <button
            onClick={handleToggle}
            className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        
        {isExpanded && (
          <div className="p-12 text-center text-white/60 border-t border-white/10">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play size={24} />
            </div>
            <p>Click Video Play icons in Tags and Saved Entries to start watching</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a]/50 border border-white/10 rounded-xl mb-6 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <Play size={20} className="text-[#2d9edb]" />
          <span className="text-white">
            {playlist ? (
              <>
                Playing {currentIndex + 1} of {playlist.length}
                {playlist[currentIndex]?.tags.length > 0 && (
                  <span className="ml-2 text-white/60">
                    from tag: {playlist[currentIndex].tags[0]}
                  </span>
                )}
              </>
            ) : (
              currentVideo.title
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
          {videoId && (
            <YouTube
              videoId={videoId}
              className="absolute inset-0"
              opts={{
                width: '100%',
                height: '100%',
                playerVars: {
                  autoplay: 1,
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
                onClick={onPreviousVideo}
                disabled={!onPreviousVideo}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous video (Left Arrow)"
              >
                <SkipBack size={20} />
              </button>
              
              <button
                onClick={handlePlayPause}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                title="Play/Pause (Space)"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button
                onClick={onNextVideo}
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
              {currentVideo.title}
            </h3>
            {currentVideo.explanation && (
              <div className="text-sm text-white/60">
                {formatTextWithLinks(currentVideo.explanation)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}