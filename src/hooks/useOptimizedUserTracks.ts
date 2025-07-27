/**
 * Optimized user tracks hook with React Query
 * 
 * Enhanced performance version with proper caching, invalidation,
 * and real-time updates integration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Track } from '@/hooks/useUserTracks';
import { useCallback, useEffect } from 'react';

// Query keys for React Query
export const trackQueryKeys = {
  all: ['tracks'] as const,
  user: (userId: string) => [...trackQueryKeys.all, 'user', userId] as const,
  track: (trackId: string) => [...trackQueryKeys.all, 'track', trackId] as const,
};

// Transform database track to Track interface
const transformTrack = (dbTrack: any): Track => ({
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
});

// Fetch user tracks function
const fetchUserTracks = async (userId: string): Promise<Track[]> => {
  const { data, error } = await supabase
    .from('tracks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(transformTrack);
};

export function useOptimizedUserTracks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main tracks query
  const tracksQuery = useQuery({
    queryKey: trackQueryKeys.user(user?.id || ''),
    queryFn: () => fetchUserTracks(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete track mutation
  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', trackId)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);
      return trackId;
    },
    onSuccess: (deletedTrackId) => {
      // Optimistic update
      queryClient.setQueryData<Track[]>(
        trackQueryKeys.user(user!.id),
        (old) => old?.filter(track => track.id !== deletedTrackId) || []
      );
      
      toast({
        title: "Трек удален",
        description: "Трек успешно удален из библиотеки",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка удаления",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update track mutation
  const updateTrackMutation = useMutation({
    mutationFn: async ({ trackId, updates }: { trackId: string, updates: Partial<Track> }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('tracks')
        .update(updates)
        .eq('id', trackId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return transformTrack(data);
    },
    onSuccess: (updatedTrack) => {
      // Optimistic update
      queryClient.setQueryData<Track[]>(
        trackQueryKeys.user(user!.id),
        (old) => old?.map(track => 
          track.id === updatedTrack.id ? updatedTrack : track
        ) || []
      );
    },
    onError: (error) => {
      toast({
        title: "Ошибка обновления",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Like track mutation
  const likeTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      if (!user) throw new Error('User not authenticated');
      
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

        // Get current track data to decrease like count
        const currentTracks = queryClient.getQueryData<Track[]>(trackQueryKeys.user(user.id));
        const currentTrack = currentTracks?.find(t => t.id === trackId);
        
        await supabase
          .from('tracks')
          .update({ like_count: Math.max(0, (currentTrack?.like_count || 1) - 1) })
          .eq('id', trackId);

        return { trackId, liked: false, newCount: Math.max(0, (currentTrack?.like_count || 1) - 1) };
      } else {
        // Like
        await supabase
          .from('track_likes')
          .insert({
            user_id: user.id,
            track_id: trackId
          });

        // Get current track data to increase like count
        const currentTracks = queryClient.getQueryData<Track[]>(trackQueryKeys.user(user.id));
        const currentTrack = currentTracks?.find(t => t.id === trackId);
        
        await supabase
          .from('tracks')
          .update({ like_count: (currentTrack?.like_count || 0) + 1 })
          .eq('id', trackId);

        return { trackId, liked: true, newCount: (currentTrack?.like_count || 0) + 1 };
      }
    },
    onSuccess: ({ trackId, newCount }) => {
      // Optimistic update
      queryClient.setQueryData<Track[]>(
        trackQueryKeys.user(user!.id),
        (old) => old?.map(track => 
          track.id === trackId ? { ...track, like_count: newCount } : track
        ) || []
      );
    },
    onError: (error) => {
      toast({
        title: "Ошибка лайка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Manual reload function
  const reloadTracks = useCallback(() => {
    if (user) {
      queryClient.invalidateQueries({ 
        queryKey: trackQueryKeys.user(user.id),
        refetchType: 'active' 
      });
    }
  }, [user, queryClient]);

  // Set up real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('tracks-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracks',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Invalidate and refetch when new tracks are added
          queryClient.invalidateQueries({ 
            queryKey: trackQueryKeys.user(user.id) 
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tracks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          // Update specific track in cache
          const updatedTrack = transformTrack(payload.new);
          queryClient.setQueryData<Track[]>(
            trackQueryKeys.user(user.id),
            (old) => old?.map(track => 
              track.id === updatedTrack.id ? updatedTrack : track
            ) || []
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    tracks: tracksQuery.data || [],
    isLoading: tracksQuery.isLoading,
    error: tracksQuery.error?.message || null,
    isRefetching: tracksQuery.isRefetching,
    
    // Actions
    deleteTrack: deleteTrackMutation.mutate,
    updateTrack: updateTrackMutation.mutate,
    likeTrack: likeTrackMutation.mutate,
    reloadTracks,
    
    // Loading states for mutations
    isDeletingTrack: deleteTrackMutation.isPending,
    isUpdatingTrack: updateTrackMutation.isPending,
    isLikingTrack: likeTrackMutation.isPending,
  };
}