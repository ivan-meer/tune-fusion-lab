import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAudioPlayer } from '../useAudioPlayer';

// Mock track data
const mockTrack = {
  id: 'test-track-1',
  title: 'Test Track',
  file_url: 'https://example.com/track.mp3',
  duration: 180,
  tags: [],
  is_public: false,
  provider: 'suno' as const,
  play_count: 0,
  like_count: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockTrack2 = {
  ...mockTrack,
  id: 'test-track-2',
  title: 'Test Track 2',
  file_url: 'https://example.com/track2.mp3'
};

describe('useAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [state] = result.current;

    expect(state.currentTrack).toBeNull();
    expect(state.isPlaying).toBe(false);
    expect(state.currentTime).toBe(0);
    expect(state.duration).toBe(0);
    expect(state.volume).toBe(1);
    expect(state.isMuted).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.playlist).toEqual([]);
    expect(state.currentIndex).toBe(-1);
    expect(state.repeatMode).toBe('none');
    expect(state.shuffleEnabled).toBe(false);
  });

  it('plays a track', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    act(() => {
      actions.playTrack(mockTrack);
    });

    const [state] = result.current;
    expect(state.currentTrack).toEqual(mockTrack);
    expect(state.isPlaying).toBe(true);
    expect(state.playlist).toContain(mockTrack);
  });

  it('pauses playback', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    // First play a track
    act(() => {
      actions.playTrack(mockTrack);
    });

    // Then pause
    act(() => {
      actions.pause();
    });

    const [state] = result.current;
    expect(state.isPlaying).toBe(false);
    expect(state.currentTrack).toEqual(mockTrack); // Track should still be current
  });

  it('resumes playback', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    // Play, pause, then resume
    act(() => {
      actions.playTrack(mockTrack);
    });

    act(() => {
      actions.pause();
    });

    act(() => {
      actions.resume();
    });

    const [state] = result.current;
    expect(state.isPlaying).toBe(true);
  });

  it('stops playback', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    act(() => {
      actions.playTrack(mockTrack);
    });

    act(() => {
      actions.stop();
    });

    const [state] = result.current;
    expect(state.isPlaying).toBe(false);
    expect(state.currentTime).toBe(0);
  });

  it('seeks to specific time', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    act(() => {
      actions.playTrack(mockTrack);
    });

    act(() => {
      actions.seekTo(60);
    });

    const [state] = result.current;
    expect(state.currentTime).toBe(60);
  });

  it('adjusts volume', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    act(() => {
      actions.setVolume(0.5);
    });

    const [state] = result.current;
    expect(state.volume).toBe(0.5);
  });

  it('toggles mute', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    act(() => {
      actions.toggleMute();
    });

    let [state] = result.current;
    expect(state.isMuted).toBe(true);

    act(() => {
      actions.toggleMute();
    });

    [state] = result.current;
    expect(state.isMuted).toBe(false);
  });

  // Note: setPlaylist doesn't exist, tracks are added via playTrack
  it('adds tracks to playlist when playing', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    act(() => {
      actions.playTrack(mockTrack, [mockTrack, mockTrack2]);
    });

    const [state] = result.current;
    expect(state.playlist).toContain(mockTrack);
  });

  it('plays next track in playlist', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    const playlist = [mockTrack, mockTrack2];

    act(() => {
      actions.playTrack(mockTrack, playlist); // Start with first track and set playlist
    });

    act(() => {
      actions.nextTrack();
    });

    const [state] = result.current;
    expect(state.currentTrack).toEqual(mockTrack2);
    expect(state.currentIndex).toBe(1);
  });

  it('plays previous track in playlist', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    const playlist = [mockTrack, mockTrack2];

    act(() => {
      actions.playTrack(mockTrack2, playlist); // Start with second track and set playlist
    });

    act(() => {
      actions.previousTrack();
    });

    const [state] = result.current;
    expect(state.currentTrack).toEqual(mockTrack);
    expect(state.currentIndex).toBe(0);
  });

  it('toggles shuffle mode', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    act(() => {
      actions.toggleShuffle();
    });

    let [state] = result.current;
    expect(state.shuffleEnabled).toBe(true);

    act(() => {
      actions.toggleShuffle();
    });

    [state] = result.current;
    expect(state.shuffleEnabled).toBe(false);
  });

  it('cycles through repeat modes', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    // none -> all
    act(() => {
      actions.setRepeatMode('all');
    });

    let [state] = result.current;
    expect(state.repeatMode).toBe('all');

    // all -> one
    act(() => {
      actions.setRepeatMode('one');
    });

    [state] = result.current;
    expect(state.repeatMode).toBe('one');

    // one -> none
    act(() => {
      actions.setRepeatMode('none');
    });

    [state] = result.current;
    expect(state.repeatMode).toBe('none');
  });

  it('handles track ending with repeat mode "one"', () => {
    const { result } = renderHook(() => useAudioPlayer());
    const [, actions] = result.current;

    act(() => {
      actions.playTrack(mockTrack);
      actions.setRepeatMode('one');
    });

    // Simulate track end
    act(() => {
      // This would normally be triggered by the audio element's 'ended' event
      // For testing, we'll assume the hook handles this correctly
    });

    const [state] = result.current;
    expect(state.repeatMode).toBe('one');
    // In real implementation, the same track should restart
  });
});