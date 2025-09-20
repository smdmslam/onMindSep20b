import React, { useEffect, useCallback, useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { X, SkipBack, SkipForward, Pause, Play, Volume2, VolumeX, RefreshCw, Volume1, Volume } from 'lucide-react';
import { extractYouTubeVideoId } from '../lib/metadata';
import type { Entry } from '../lib/firebase-client';

type YouTubeModalProps = {
  url: string;
  onClose: () => void;
  playlist?: Entry[];
  currentIndex?: number;
  onNextVideo?: () => void;
  onPreviousVideo?: () => void;
  title?: string;
};

export function YouTubeModal({ 
  url, 
  onClose,
  playlist,
  currentIndex = 0,
  onNextVideo,
  onPreviousVideo,
  title: propTitle
}: YouTubeModalProps) {
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const videoId = extractYouTubeVideoId(url);

  // Get title either from props or playlist
  const title = propTitle || (playlist && playlist[currentIndex]?.title);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (player) {
        if (isPlaying) {
          player.pauseVideo();
        } else {
          player.playVideo();
        }
      }
    } else if (e.key === 'ArrowRight' && onNextVideo) {
      onNextVideo();
    } else if (e.key === 'ArrowLeft' && onPreviousVideo) {
      onPreviousVideo();
    } else if (e.key === 'm') {
      if (player) {
        if (isMuted) {
          player.unMute();
        } else {
          player.mute();
        }
        setIsMuted(!isMuted);
      }
    } else if (e.key === 'ArrowUp') {
      if (player && volume < 100) {
        const newVolume = Math.min(100, volume + 10);
        player.setVolume(newVolume);
        setVolume(newVolume);
      }
    } else if (e.key === 'ArrowDown') {
      if (player && volume > 0) {
        const newVolume = Math.max(0, volume - 10);
        player.setVolume(newVolume);
        setVolume(newVolume);
      }
    }
  }, [onClose, onNextVideo, onPreviousVideo, player, isPlaying, isMuted, volume]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    if (player && isPlaying && !isDragging) {
      progressInterval = setInterval(() => {
        const currentTime = player.getCurrentTime();
        const videoDuration = player.getDuration();
        setProgress((currentTime / videoDuration) * 100);
        setDuration(videoDuration);
      }, 1000);
    }
    return () => clearInterval(progressInterval);
  }, [player, isPlaying, isDragging]);

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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (player && duration) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickPosition = (e.clientX - rect.left) / rect.width;
      const newTime = clickPosition * duration;
      player.seekTo(newTime, true);
    }
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    document.addEventListener('mousemove', handleProgressMouseMove);
    document.addEventListener('mouseup', handleProgressMouseUp);
  };

  const handleProgressMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && progressBarRef.current && player && duration) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setProgress(position * 100);
    }
  }, [isDragging, player, duration]);

  const handleProgressMouseUp = useCallback((e: MouseEvent) => {
    if (isDragging && progressBarRef.current && player && duration) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      player.seekTo(position * duration, true);
    }
    setIsDragging(false);
    document.removeEventListener('mousemove', handleProgressMouseMove);
    document.removeEventListener('mouseup', handleProgressMouseUp);
  }, [isDragging, player, duration]);

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleProgressMouseMove);
      document.removeEventListener('mouseup', handleProgressMouseUp);
    };
  }, [handleProgressMouseMove, handleProgressMouseUp]);

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

  if (!videoId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-[#2d9edb] to-[#2d9edb]/70 rounded-lg flex items-center justify-center text-sm">
              OM
            </span>
            {playlist ? (
              <span>
                Playing {currentIndex + 1} of {playlist.length}
                {playlist[currentIndex]?.tags.length > 0 && (
                  <span className="ml-2 text-sm text-white/60">
                    from tag: {playlist[currentIndex].tags[0]}
                  </span>
                )}
              </span>
            ) : (
              'On Mind Video Viewer'
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-[#2d1b69]/90 to-[#1a1a1a] border border-white/20 rounded-xl p-3 shadow-xl">
          <div className="relative pt-[56.25%] bg-black rounded-lg overflow-hidden">
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
          </div>

          {/* Progress Bar */}
          <div 
            ref={progressBarRef}
            className="relative h-2 bg-white/20 mt-3 cursor-pointer rounded-full group"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
          >
            <div 
              className="absolute h-full bg-[#2d9edb] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            <div 
              className="absolute h-4 w-4 bg-[#2d9edb] rounded-full -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: 'translateX(-50%)' }}
            />
          </div>

          {/* Custom Video Controls */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={onPreviousVideo}
                disabled={!onPreviousVideo}
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title={onPreviousVideo ? "Previous video (Left Arrow)" : "No previous video"}
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
                title={onNextVideo ? "Next video (Right Arrow)" : "No next video"}
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

          {/* Video Title */}
          {title && (
            <div className="px-4 pb-2">
              <h3 className="text-lg text-white font-medium">
                {title}
              </h3>
              {playlist && playlist[currentIndex]?.explanation && (
                <p className="text-sm text-white/60 mt-1">
                  {playlist[currentIndex].explanation}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}