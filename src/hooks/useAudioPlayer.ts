/**
 * Custom hook for managing global audio playback functionality
 * 
 * Provides centralized audio control, track queue management, and playback state
 * Handles HTML5 Audio API interactions with error handling and user experience features
 * 
 * @author AI Music Generator Team
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Track } from '@/hooks/useUserTracks';
import { useToast } from '@/hooks/use-toast';

/**
 * Audio player state interface
 * Defines the current state of the global audio player
 */
export interface AudioPlayerState {
  /** Currently playing track */
  currentTrack: Track | null;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total track duration in seconds */
  duration: number;
  /** Audio volume (0-1) */
  volume: number;
  /** Whether player is muted */
  isMuted: boolean;
  /** Current loading state */
  isLoading: boolean;
  /** Error message if playback failed */
  error: string | null;
  /** Current playlist/queue */
  playlist: Track[];
  /** Current track index in playlist */
  currentIndex: number;
  /** Repeat mode: 'none' | 'one' | 'all' */
  repeatMode: 'none' | 'one' | 'all';
  /** Whether shuffle is enabled */
  shuffleEnabled: boolean;
}

/**
 * Audio player actions interface
 * Defines all available player control methods
 */
export interface AudioPlayerActions {
  /** Play a specific track */
  playTrack: (track: Track, playlist?: Track[]) => Promise<void>;
  /** Play track by ID from current playlist */
  playTrackById: (trackId: string) => Promise<void>;
  /** Pause current playback */
  pause: () => void;
  /** Resume playback */
  resume: () => void;
  /** Toggle play/pause */
  togglePlayPause: () => void;
  /** Stop playback and reset */
  stop: () => void;
  /** Seek to specific time position */
  seekTo: (time: number) => void;
  /** Set volume level */
  setVolume: (volume: number) => void;
  /** Toggle mute state */
  toggleMute: () => void;
  /** Play next track in queue */
  nextTrack: () => void;
  /** Play previous track */
  previousTrack: () => void;
  /** Set repeat mode */
  setRepeatMode: (mode: 'none' | 'one' | 'all') => void;
  /** Toggle shuffle mode */
  toggleShuffle: () => void;
  /** Clear current playlist */
  clearPlaylist: () => void;
}

/**
 * Global audio player hook
 * 
 * Manages all audio playback functionality including:
 * - Track playback control (play, pause, stop, seek)
 * - Volume and mute controls
 * - Playlist management with shuffle and repeat
 * - Error handling and loading states
 * - Keyboard shortcuts support
 * - Automatic track progression
 * 
 * @returns {[AudioPlayerState, AudioPlayerActions]} State and actions tuple
 */
export function useAudioPlayer(): [AudioPlayerState, AudioPlayerActions] {
  // Audio element reference - centralized HTML5 audio control
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Shuffle history to avoid immediate repeats
  const shuffleHistoryRef = useRef<string[]>([]);
  
  const { toast } = useToast();

  // Player state management
  const [state, setState] = useState<AudioPlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7, // Default to 70% volume for user comfort
    isMuted: false,
    isLoading: false,
    error: null,
    playlist: [],
    currentIndex: -1,
    repeatMode: 'none',
    shuffleEnabled: false
  });

  // Debug logging for audio state
  const logAudioState = useCallback(() => {
    if (audioRef.current) {
      console.log('🎵 Audio element state:', {
        src: audioRef.current.src,
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration,
        paused: audioRef.current.paused,
        readyState: audioRef.current.readyState,
        networkState: audioRef.current.networkState
      });
      console.log('🎵 Hook state:', {
        currentTrack: state.currentTrack?.title || null,
        isPlaying: state.isPlaying,
        isLoading: state.isLoading,
        currentTime: state.currentTime,
        duration: state.duration
      });
    }
  }, [state]);

  /**
   * Initialize audio element with event listeners
   * Sets up all necessary HTML5 audio events for state management
   */
  const initializeAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata'; // Preload metadata for duration
    }

    const audio = audioRef.current;

    // Playback event handlers
    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    };

    const handleLoadedMetadata = () => {
      console.log('🎵 Audio loaded metadata:', { duration: audio.duration });
      setState(prev => ({ 
        ...prev, 
        duration: audio.duration || 0,
        isLoading: false 
      }));
    };

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handlePlay = () => {
      console.log('🎵 Audio started playing');
      setState(prev => ({ ...prev, isPlaying: true }));
    };

    const handlePause = () => {
      console.log('🎵 Audio paused');
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      // Auto-advance to next track
      setTimeout(() => nextTrack(), 100);
    };

    const handleError = (e: Event) => {
      const errorMessage = 'Ошибка загрузки аудиофайла';
      console.error('Audio playback error:', e);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: false,
        error: errorMessage 
      }));
      
      toast({
        title: "Ошибка воспроизведения",
        description: errorMessage,
        variant: "destructive"
      });
    };

    const handleCanPlay = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    // Attach all event listeners
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Cleanup function to remove listeners
    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [toast]);

  /**
   * Play a specific track with optional playlist context
   * 
   * @param track - Track to play
   * @param playlist - Optional playlist context for queue management
   */
  const playTrack = useCallback(async (track: Track, playlist?: Track[]) => {
    try {
      if (!track.file_url) {
        throw new Error('Файл трека недоступен');
      }

      // Initialize audio if not already done
      if (!audioRef.current) {
        initializeAudio();
      }

      const audio = audioRef.current!;
      
      // Set new source and track info
      audio.src = track.file_url;
      audio.volume = state.isMuted ? 0 : state.volume;

      // Update state with new track info immediately for UI responsiveness
      const newPlaylist = playlist || state.playlist;
      const trackIndex = newPlaylist.findIndex(t => t.id === track.id);
      
      setState(prev => ({
        ...prev,
        currentTrack: track,
        playlist: newPlaylist,
        currentIndex: trackIndex,
        error: null,
        isLoading: true
      }));

      console.log('🎵 Loading track:', { title: track.title, url: track.file_url });

      // Start playback
      await audio.play();

      // TODO: Track play count analytics
      // TODO: Add to recently played history
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка воспроизведения';
      console.error('Play track error:', error);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        isPlaying: false,
        error: errorMessage 
      }));

      toast({
        title: "Ошибка воспроизведения",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [state.volume, state.isMuted, state.playlist, initializeAudio, toast]);

  /**
   * Play track by ID from current playlist
   */
  const playTrackById = useCallback(async (trackId: string) => {
    const track = state.playlist.find(t => t.id === trackId);
    if (track) {
      await playTrack(track, state.playlist);
    }
  }, [state.playlist, playTrack]);

  /**
   * Pause current playback
   */
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  /**
   * Resume playback
   */
  const resume = useCallback(() => {
    if (audioRef.current && state.currentTrack && audioRef.current.src) {
      audioRef.current.play().catch(error => {
        console.error('Resume playback error:', error);
        setState(prev => ({ ...prev, isPlaying: false }));
        toast({
          title: "Ошибка воспроизведения",
          description: "Не удалось возобновить воспроизведение",
          variant: "destructive"
        });
      });
    }
  }, [state.currentTrack, toast]);

  /**
   * Toggle play/pause state
   */
  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [state.isPlaying, pause, resume]);

  /**
   * Stop playback and reset position
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0
    }));
  }, []);

  /**
   * Seek to specific time position
   */
  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(time, state.duration));
    }
  }, [state.duration]);

  /**
   * Set volume level (0-1)
   */
  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: clampedVolume }));
    
    if (audioRef.current) {
      audioRef.current.volume = state.isMuted ? 0 : clampedVolume;
    }
  }, [state.isMuted]);

  /**
   * Toggle mute state
   */
  const toggleMute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    
    if (audioRef.current) {
      audioRef.current.volume = !state.isMuted ? 0 : state.volume;
    }
  }, [state.isMuted, state.volume]);

  /**
   * Get next track index based on current settings
   */
  const getNextTrackIndex = useCallback((): number => {
    if (state.playlist.length === 0) return -1;
    
    if (state.shuffleEnabled) {
      // Shuffle logic with history to avoid immediate repeats
      const availableTracks = state.playlist
        .map((_, index) => index)
        .filter(index => !shuffleHistoryRef.current.includes(state.playlist[index].id));
      
      if (availableTracks.length === 0) {
        // Reset history if we've played all tracks
        shuffleHistoryRef.current = [];
        return Math.floor(Math.random() * state.playlist.length);
      }
      
      return availableTracks[Math.floor(Math.random() * availableTracks.length)];
    }
    
    // Normal progression
    return (state.currentIndex + 1) % state.playlist.length;
  }, [state.playlist, state.currentIndex, state.shuffleEnabled]);

  /**
   * Play next track in queue
   */
  const nextTrack = useCallback(() => {
    if (state.repeatMode === 'one' && state.currentTrack) {
      // Repeat current track
      playTrack(state.currentTrack, state.playlist);
      return;
    }

    const nextIndex = getNextTrackIndex();
    if (nextIndex >= 0 && nextIndex < state.playlist.length) {
      const nextTrack = state.playlist[nextIndex];
      
      // Add to shuffle history
      if (state.shuffleEnabled && state.currentTrack) {
        shuffleHistoryRef.current.push(state.currentTrack.id);
        // Keep history manageable
        if (shuffleHistoryRef.current.length > state.playlist.length / 2) {
          shuffleHistoryRef.current = shuffleHistoryRef.current.slice(-Math.floor(state.playlist.length / 3));
        }
      }
      
      playTrack(nextTrack, state.playlist);
    } else if (state.repeatMode === 'all' && state.playlist.length > 0) {
      // Start from beginning
      playTrack(state.playlist[0], state.playlist);
    }
  }, [state.repeatMode, state.currentTrack, state.playlist, state.shuffleEnabled, getNextTrackIndex, playTrack]);

  /**
   * Play previous track
   */
  const previousTrack = useCallback(() => {
    if (state.currentIndex > 0) {
      const prevTrack = state.playlist[state.currentIndex - 1];
      playTrack(prevTrack, state.playlist);
    } else if (state.repeatMode === 'all' && state.playlist.length > 0) {
      // Go to last track
      const lastTrack = state.playlist[state.playlist.length - 1];
      playTrack(lastTrack, state.playlist);
    }
  }, [state.currentIndex, state.playlist, state.repeatMode, playTrack]);

  /**
   * Set repeat mode
   */
  const setRepeatMode = useCallback((mode: 'none' | 'one' | 'all') => {
    setState(prev => ({ ...prev, repeatMode: mode }));
  }, []);

  /**
   * Toggle shuffle mode
   */
  const toggleShuffle = useCallback(() => {
    setState(prev => ({ ...prev, shuffleEnabled: !prev.shuffleEnabled }));
    // Clear shuffle history when toggling
    shuffleHistoryRef.current = [];
  }, []);

  /**
   * Clear current playlist
   */
  const clearPlaylist = useCallback(() => {
    stop();
    setState(prev => ({
      ...prev,
      currentTrack: null,
      playlist: [],
      currentIndex: -1
    }));
    shuffleHistoryRef.current = [];
  }, [stop]);

  // Initialize audio on mount
  useEffect(() => {
    const cleanup = initializeAudio();
    return cleanup;
  }, [initializeAudio]);

  // Keyboard shortcuts support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            nextTrack();
          }
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            previousTrack();
          }
          break;
        // TODO: Add more shortcuts (volume, seek, etc.)
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, nextTrack, previousTrack]);

  // Actions object
  const actions: AudioPlayerActions = {
    playTrack,
    playTrackById,
    pause,
    resume,
    togglePlayPause,
    stop,
    seekTo,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
    setRepeatMode,
    toggleShuffle,
    clearPlaylist
  };

  return [state, actions];
}
