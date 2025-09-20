import { useState, useCallback } from 'react';
import type { Entry } from '../lib/firebase-client';

type PlaylistState = {
  videos: Entry[];
  currentIndex: number;
} | null;

export function usePlaylist() {
  const [playlistState, setPlaylistState] = useState<PlaylistState>(null);

  const startPlaylist = useCallback((videos: Entry[], startIndex = 0) => {
    setPlaylistState({
      videos,
      currentIndex: startIndex
    });
  }, []);

  const stopPlaylist = useCallback(() => {
    setPlaylistState(null);
  }, []);

  const nextVideo = useCallback(() => {
    if (playlistState && playlistState.currentIndex < playlistState.videos.length - 1) {
      setPlaylistState({
        ...playlistState,
        currentIndex: playlistState.currentIndex + 1
      });
      return true;
    }
    return false;
  }, [playlistState]);

  const previousVideo = useCallback(() => {
    if (playlistState && playlistState.currentIndex > 0) {
      setPlaylistState({
        ...playlistState,
        currentIndex: playlistState.currentIndex - 1
      });
      return true;
    }
    return false;
  }, [playlistState]);

  const getCurrentVideo = useCallback(() => {
    if (!playlistState) return null;
    return playlistState.videos[playlistState.currentIndex];
  }, [playlistState]);

  return {
    playlistState,
    startPlaylist,
    stopPlaylist,
    nextVideo,
    previousVideo,
    getCurrentVideo,
    hasNext: playlistState ? playlistState.currentIndex < playlistState.videos.length - 1 : false,
    hasPrevious: playlistState ? playlistState.currentIndex > 0 : false,
    currentIndex: playlistState?.currentIndex ?? -1,
    totalVideos: playlistState?.videos.length ?? 0
  };
}