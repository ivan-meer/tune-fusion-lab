/**
 * Hook for managing track storage integration with Supabase
 * 
 * Provides centralized file management for audio tracks:
 * - Syncs database records with storage bucket files
 * - Generates and validates public URLs 
 * - Handles file uploads and downloads
 * - Manages storage bucket lifecycle
 * 
 * @author AI Music Generator Team
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Storage file metadata interface
 * Represents file information from Supabase Storage
 */
interface StorageFileInfo {
  name: string;
  id: string | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, any> | null;
}

/**
 * Track storage operations interface
 * Defines available storage management functions
 */
interface TrackStorageOperations {
  syncTrackUrls: (trackId?: string) => Promise<void>;
  uploadTrackFile: (file: File, trackId: string) => Promise<string>;
  deleteTrackFile: (filePath: string) => Promise<void>;
  getPublicUrl: (filePath: string) => string;
  validateFileExists: (filePath: string) => Promise<boolean>;
  listBucketFiles: () => Promise<StorageFileInfo[]>;
  cleanupOrphanedFiles: () => Promise<void>;
}

/**
 * Custom hook for track storage management
 * 
 * Manages the integration between tracks table and audio-tracks bucket
 * Ensures data consistency and provides file operation utilities
 * 
 * @returns {object} Storage operations and state
 */
export function useTrackStorage(): TrackStorageOperations & {
  isLoading: boolean;
  error: string | null;
} {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Synchronizes track file URLs with storage bucket
   * Updates database records with correct public URLs
   * 
   * @param trackId - Optional specific track ID to sync
   */
  const syncTrackUrls = useCallback(async (trackId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get tracks from database
      let query = supabase
        .from('tracks')
        .select('id, file_path, file_url');

      if (trackId) {
        query = query.eq('id', trackId);
      }

      const { data: tracks, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch tracks: ${fetchError.message}`);
      }

      if (!tracks || tracks.length === 0) {
        console.log('No tracks found to sync');
        return;
      }

      // Process each track
      const updatePromises = tracks.map(async (track) => {
        if (!track.file_path) {
          console.warn(`Track ${track.id} has no file_path`);
          return;
        }

        // Check if file exists in storage
        const fileExists = await validateFileExists(track.file_path);
        
        if (!fileExists) {
          console.warn(`File not found in storage: ${track.file_path}`);
          
          // TODO: Could implement automatic cleanup here
          // For now, just log the issue
          return;
        }

        // Generate public URL
        const publicUrl = getPublicUrl(track.file_path);
        
        // Update database if URL has changed
        if (track.file_url !== publicUrl) {
          const { error: updateError } = await supabase
            .from('tracks')
            .update({ file_url: publicUrl })
            .eq('id', track.id);

          if (updateError) {
            console.error(`Failed to update track ${track.id}:`, updateError);
          } else {
            console.log(`Synced URL for track ${track.id}`);
          }
        }
      });

      await Promise.all(updatePromises);

      // Only show toast for manual sync operations (when trackId is not provided)
      if (!trackId) {
        toast({
          title: "Синхронизация завершена",
          description: `Обновлено ${tracks.length} треков`,
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync track URLs';
      setError(errorMessage);
      
      toast({
        title: "Ошибка синхронизации",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Uploads a track file to storage bucket
   * 
   * @param file - Audio file to upload
   * @param trackId - Associated track ID
   * @returns Public URL of uploaded file
   */
  const uploadTrackFile = useCallback(async (file: File, trackId: string): Promise<string> => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate file path: user_id/track_id.extension
      const fileExtension = file.name.split('.').pop();
      const fileName = `${trackId}.${fileExtension}`;
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('tracks')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite if exists
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const publicUrl = getPublicUrl(filePath);

      // Update track record with file info
      const { error: updateError } = await supabase
        .from('tracks')
        .update({
          file_path: filePath,
          file_url: publicUrl,
          file_size: file.size,
          audio_format: fileExtension
        })
        .eq('id', trackId);

      if (updateError) {
        console.error('Failed to update track record:', updateError);
        // Don't throw here as file was uploaded successfully
      }

      toast({
        title: "Файл загружен",
        description: `Трек успешно сохранен в хранилище`,
      });

      return publicUrl;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      
      toast({
        title: "Ошибка загрузки",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Deletes a track file from storage
   * 
   * @param filePath - Path to file in storage bucket
   */
  const deleteTrackFile = useCallback(async (filePath: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase.storage
        .from('tracks')
        .remove([filePath]);

      if (deleteError) {
        throw new Error(`Delete failed: ${deleteError.message}`);
      }

      // NOTE: Database cleanup should be handled by the calling component
      // This function only handles storage operations

      toast({
        title: "Файл удален",
        description: "Трек удален из хранилища",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      
      toast({
        title: "Ошибка удаления",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Generates public URL for a file in storage
   * 
   * @param filePath - Path to file in storage bucket
   * @returns Public URL string
   */
  const getPublicUrl = useCallback((filePath: string): string => {
    const { data } = supabase.storage
      .from('tracks')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  }, []);

  /**
   * Validates if a file exists in storage bucket
   * 
   * @param filePath - Path to check
   * @returns Promise resolving to existence boolean
   */
  const validateFileExists = useCallback(async (filePath: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.storage
        .from('tracks')
        .list('', {
          search: filePath.split('/').pop() // Search by filename only
        });

      if (error) {
        console.error('Error checking file existence:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (err) {
      console.error('Error validating file existence:', err);
      return false;
    }
  }, []);

  /**
   * Lists all files in the audio-tracks bucket
   * 
   * @returns Promise resolving to array of file info
   */
  const listBucketFiles = useCallback(async (): Promise<StorageFileInfo[]> => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase.storage
        .from('tracks')
        .list('', {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`Failed to list files: ${error.message}`);
      }

      return data || [];

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list files';
      setError(errorMessage);
      
      toast({
        title: "Ошибка загрузки списка файлов",
        description: errorMessage,
        variant: "destructive",
      });
      
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Cleans up orphaned files in storage bucket
   * Removes files that don't have corresponding database records
   * 
   * TODO: Implement this functionality carefully
   * Should only run in admin mode or with explicit user confirmation
   */
  const cleanupOrphanedFiles = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all files from storage
      const storageFiles = await listBucketFiles();
      
      // Get all track file paths from database
      const { data: tracks, error: fetchError } = await supabase
        .from('tracks')
        .select('file_path')
        .not('file_path', 'is', null);

      if (fetchError) {
        throw new Error(`Failed to fetch track paths: ${fetchError.message}`);
      }

      const databasePaths = new Set(tracks?.map(t => t.file_path) || []);
      
      // Find orphaned files (simplified check)
      const orphanedFiles = storageFiles.filter(file => {
        // Check if any database path contains this file name
        return !Array.from(databasePaths).some(path => path && path.includes(file.name));
      });

      if (orphanedFiles.length === 0) {
        toast({
          title: "Очистка завершена",
          description: "Потерянных файлов не найдено",
        });
        return;
      }

      // FIXME: Add confirmation dialog before deleting
      console.warn(`Found ${orphanedFiles.length} orphaned files:`, orphanedFiles);
      
      // For now, just log - don't delete automatically
      toast({
        title: "Найдены потерянные файлы",
        description: `Обнаружено ${orphanedFiles.length} файлов без записей в БД`,
        variant: "destructive",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup files';
      setError(errorMessage);
      
      toast({
        title: "Ошибка очистки",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, listBucketFiles]);

  return {
    syncTrackUrls,
    uploadTrackFile,
    deleteTrackFile,
    getPublicUrl,
    validateFileExists,
    listBucketFiles,
    cleanupOrphanedFiles,
    isLoading,
    error
  };
}