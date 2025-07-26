/**
 * Custom hook for managing user's music tracks
 * 
 * Enhanced version with Supabase Storage integration
 * Provides comprehensive track management with real-time sync capabilities
 * 
 * Features:
 * - Database operations (CRUD)
 * - Storage bucket synchronization
 * - Real-time updates
 * - File validation and cleanup
 * 
 * @author AI Music Generator Team
 * @version 2.0.0 - Enhanced with storage integration
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useTrackStorage } from '@/hooks/useTrackStorage';
import { useToast } from '@/hooks/use-toast';

// Use the Database types from Supabase
type DatabaseTrack = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  duration: number | null;
  file_url: string | null;
  file_path: string | null;
  file_size: number | null;
  audio_format: string | null;
  artwork_url: string | null;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  key_signature: string | null;
  is_public: boolean;
  is_commercial: boolean;
  provider: string;
  provider_track_id: string | null;
  generation_params: any;
  lyrics: string | null;
  tags: string[] | null;
  play_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
};

export interface Track {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  file_url?: string;
  artwork_url?: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  is_public: boolean;
  provider: 'mureka' | 'suno' | 'hybrid';
  lyrics?: string;
  tags?: string[];
  play_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

export function useUserTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Storage integration hook
  const trackStorage = useTrackStorage();

  /**
   * Loads user tracks from database with automatic storage sync
   * Enhanced version that validates file URLs and syncs with storage bucket
   */
  const loadTracks = useCallback(async (syncStorage = true) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Transform database tracks to our Track interface
      const transformedTracks: Track[] = (data || []).map((dbTrack: DatabaseTrack) => ({
        id: dbTrack.id,
        title: dbTrack.title,
        description: dbTrack.description || undefined,
        duration: dbTrack.duration || undefined,
        file_url: dbTrack.file_url || undefined,
        artwork_url: dbTrack.artwork_url || undefined,
        genre: dbTrack.genre || undefined,
        mood: dbTrack.mood || undefined,
        bpm: dbTrack.bpm || undefined,
        is_public: dbTrack.is_public,
        provider: (dbTrack.provider as 'mureka' | 'suno' | 'hybrid') || 'suno',
        lyrics: dbTrack.lyrics || undefined,
        tags: dbTrack.tags || undefined,
        play_count: dbTrack.play_count,
        like_count: dbTrack.like_count,
        created_at: dbTrack.created_at,
        updated_at: dbTrack.updated_at
      }));

      setTracks(transformedTracks);

      // Automatically sync storage URLs if requested
      if (syncStorage && transformedTracks.length > 0) {
        // Don't await this to avoid blocking the UI
        trackStorage.syncTrackUrls().catch(console.error);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tracks';
      setError(errorMessage);
      console.error('Error loading tracks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, trackStorage]);

  const deleteTrack = useCallback(async (trackId: string) => {
    if (!user) return;

    try {
      const { error: deleteError } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Remove from local state
      setTracks(prev => prev.filter(track => track.id !== trackId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete track';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  const updateTrack = useCallback(async (trackId: string, updates: Partial<Track>) => {
    if (!user) return;

    try {
      const { data, error: updateError } = await supabase
        .from('tracks')
        .update(updates)
        .eq('id', trackId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state  
      setTracks(prev => prev.map(track => 
        track.id === trackId ? { ...track, ...updates } : track
      ));

      return data as DatabaseTrack;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update track';
      setError(errorMessage);
      throw err;
    }
  }, [user]);

  const likeTrack = useCallback(async (trackId: string) => {
    if (!user) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('track_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', trackId)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('track_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);

        // Decrease like count
        await supabase
          .from('tracks')
          .update({ like_count: tracks.find(t => t.id === trackId)?.like_count - 1 || 0 })
          .eq('id', trackId);
      } else {
        // Like
        await supabase
          .from('track_likes')
          .insert({
            user_id: user.id,
            track_id: trackId
          });

        // Increase like count
        await supabase
          .from('tracks')
          .update({ like_count: tracks.find(t => t.id === trackId)?.like_count + 1 || 1 })
          .eq('id', trackId);
      }

      // Reload tracks to get updated counts
      await loadTracks();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to like track';
      setError(errorMessage);
      throw err;
    }
  }, [user, tracks, loadTracks]);

  /**
   * Manually sync all track URLs with storage bucket
   * Useful for fixing broken file URLs or after storage changes
   */
  const syncTrackStorage = useCallback(async () => {
    try {
      await trackStorage.syncTrackUrls();
      // Reload tracks to get updated URLs
      await loadTracks(false); // Don't sync again to avoid loop
      
      toast({
        title: "Синхронизация завершена",
        description: "URL треков обновлены из хранилища",
      });
    } catch (err) {
      console.error('Sync storage error:', err);
      toast({
        title: "Ошибка синхронизации",
        description: "Не удалось синхронизировать с хранилищем",
        variant: "destructive",
      });
    }
  }, [trackStorage, loadTracks, toast]);

  /**
   * Upload a new track file to storage and create database record
   * Enhanced version with full storage integration
   */
  const uploadTrack = useCallback(async (
    file: File, 
    metadata: Partial<Track>
  ): Promise<Track | null> => {
    if (!user) return null;

    try {
      setIsLoading(true);
      setError(null);

      // First create track record in database
      const { data: newTrack, error: createError } = await supabase
        .from('tracks')
        .insert([{
          user_id: user.id,
          title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
          description: metadata.description,
          genre: metadata.genre,
          mood: metadata.mood,
          tags: metadata.tags,
          is_public: metadata.is_public || false,
          provider: metadata.provider || 'suno'
        }])
        .select()
        .single();

      if (createError || !newTrack) {
        throw new Error(`Failed to create track record: ${createError?.message}`);
      }

      // Upload file to storage
      const publicUrl = await trackStorage.uploadTrackFile(file, newTrack.id);

      // Transform to our interface
      const track: Track = {
        id: newTrack.id,
        title: newTrack.title,
        description: newTrack.description || undefined,
        duration: undefined, // Will be updated when file is processed
        file_url: publicUrl,
        genre: newTrack.genre || undefined,
        mood: newTrack.mood || undefined,
        is_public: newTrack.is_public,
        provider: newTrack.provider as 'mureka' | 'suno' | 'hybrid',
        tags: newTrack.tags || undefined,
        play_count: newTrack.play_count,
        like_count: newTrack.like_count,
        created_at: newTrack.created_at,
        updated_at: newTrack.updated_at
      };

      // Update local state
      setTracks(prev => [track, ...prev]);

      toast({
        title: "Трек загружен",
        description: `"${track.title}" добавлен в библиотеку`,
      });

      return track;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload track';
      setError(errorMessage);
      
      toast({
        title: "Ошибка загрузки",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, trackStorage, toast]);

  // Load tracks when user changes
  useEffect(() => {
    if (user) {
      loadTracks();
    } else {
      setTracks([]);
    }
  }, [user, loadTracks]);

  return {
    tracks,
    isLoading: isLoading || trackStorage.isLoading,
    error: error || trackStorage.error,
    loadTracks,
    deleteTrack,
    updateTrack,
    likeTrack,
    // New storage functions
    syncTrackStorage,
    uploadTrack,
    trackStorage // Expose storage operations for advanced use
  };
}