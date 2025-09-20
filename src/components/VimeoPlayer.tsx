import React, { useEffect, useRef, useState } from 'react';
import Player from '@vimeo/player';

type VimeoPlayerProps = {
  videoId: string;
  onReady?: (player: Player) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
};

export function VimeoPlayer({
  videoId,
  onReady,
  onPlay,
  onPause,
  onEnd,
  autoplay = false,
  muted = false,
  loop = false
}: VimeoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !videoId) return;

    console.log('Creating Vimeo player for video ID:', videoId);
    setIsLoading(true);
    setError(null);

    try {
      // Create Vimeo player
      const player = new Player(containerRef.current, {
        id: parseInt(videoId),
        width: '100%',
        height: '100%',
        autoplay,
        muted,
        loop,
        responsive: true,
        controls: false, // We'll use custom controls
        background: false,
        byline: false,
        portrait: false,
        title: false
      });

      playerRef.current = player;

      // Set up event listeners
      player.ready().then(() => {
        console.log('Vimeo player ready');
        setIsLoading(false);
        if (onReady) {
          onReady(player);
        }
      }).catch((err) => {
        console.error('Vimeo player ready error:', err);
        setError('Failed to load video');
        setIsLoading(false);
      });

      if (onPlay) {
        player.on('play', () => {
          console.log('Vimeo player playing');
          onPlay();
        });
      }

      if (onPause) {
        player.on('pause', () => {
          console.log('Vimeo player paused');
          onPause();
        });
      }

      if (onEnd) {
        player.on('ended', () => {
          console.log('Vimeo player ended');
          onEnd();
        });
      }

      // Handle errors
      player.on('error', (error) => {
        console.error('Vimeo player error:', error);
        setError('Video playback error');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('Error creating Vimeo player:', err);
      setError('Failed to initialize video player');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (playerRef.current) {
        console.log('Destroying Vimeo player');
        playerRef.current.destroy().catch(console.error);
        playerRef.current = null;
      }
    };
  }, [videoId, autoplay, muted, loop, onReady, onPlay, onPause, onEnd]);

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
        <div className="text-white/60 text-center">
          <p>{error}</p>
          <p className="text-sm mt-2">Video ID: {videoId}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={containerRef} 
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-white/60 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#2d9edb] border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}
    </>
  );
}

export { Player as VimeoPlayerInstance };
