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
import { useCallback, useEffect, useMemo } from 'react';

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

// Fetch user tracks function with error handling
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

  // Main tracks query with optimized configuration
  const tracksQuery = useQuery({
    queryKey: trackQueryKeys.user(user?.id || ''),
    queryFn: () => fetchUserTracks(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Memoized tracks data for stable references
  const tracks = useMemo(() => tracksQuery.data || [], [tracksQuery.data]);

  // Delete track mutation with optimistic updates
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
    onMutate: async (trackId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: trackQueryKeys.user(user!.id) });

      // Snapshot the previous value
      const previousTracks = queryClient.getQueryData<Track[]>(trackQueryKeys.user(user!.id));

      // Optimistically update the cache
      queryClient.setQueryData<Track[]>(
        trackQueryKeys.user(user!.id),
        (old) => old?.filter(track => track.id !== trackId) || []
      );

      return { previousTracks };
    },
    onError: (error, trackId, context) => {
      // Rollback on error
      if (context?.previousTracks) {
        queryClient.setQueryData(trackQueryKeys.user(user!.id), context.previousTracks);
      }
      
      toast({
        title: "Ошибка удаления",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      toast({
        title: "Трек удален",
        description: "Трек успешно удален из библиотеки",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: trackQueryKeys.user(user!.id) });
    },
  });

  // Update track mutation with optimistic updates
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
    onMutate: async ({ trackId, updates }) => {
      await queryClient.cancelQueries({ queryKey: trackQueryKeys.user(user!.id) });

      const previousTracks = queryClient.getQueryData<Track[]>(trackQueryKeys.user(user!.id));

      queryClient.setQueryData<Track[]>(
        trackQueryKeys.user(user!.id),
        (old) => old?.map(track => 
          track.id === trackId ? { ...track, ...updates } : track
        ) || []
      );

      return { previousTracks };
    },
    onError: (error, variables, context) => {
      if (context?.previousTracks) {
        queryClient.setQueryData(trackQueryKeys.user(user!.id), context.previousTracks);
      }
      
      toast({
        title: "Ошибка обновления",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: trackQueryKeys.user(user!.id) });
    },
  });

  // Like track mutation with optimistic updates
  const likeTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      if (!user) throw new Error('User not authenticated');
      
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('track_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('track_id', trackId)
        .maybeSingle();

      const currentTracks = queryClient.getQueryData<Track[]>(trackQueryKeys.user(user.id));
      const currentTrack = currentTracks?.find(t => t.id === trackId);
      
      if (existingLike) {
        // Unlike
        await supabase
          .from('track_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);

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

        await supabase
          .from('tracks')
          .update({ like_count: (currentTrack?.like_count || 0) + 1 })
          .eq('id', trackId);

        return { trackId, liked: true, newCount: (currentTrack?.like_count || 0) + 1 };
      }
    },
    onMutate: async (trackId) => {
      await queryClient.cancelQueries({ queryKey: trackQueryKeys.user(user!.id) });

      const previousTracks = queryClient.getQueryData<Track[]>(trackQueryKeys.user(user!.id));
      const currentTrack = previousTracks?.find(t => t.id === trackId);
      
      if (currentTrack) {
        // Optimistically toggle like count
        const newCount = currentTrack.like_count > 0 ? currentTrack.like_count - 1 : currentTrack.like_count + 1;
        
        queryClient.setQueryData<Track[]>(
          trackQueryKeys.user(user!.id),
          (old) => old?.map(track => 
            track.id === trackId ? { ...track, like_count: newCount } : track
          ) || []
        );
      }

      return { previousTracks };
    },
    onError: (error, trackId, context) => {
      if (context?.previousTracks) {
        queryClient.setQueryData(trackQueryKeys.user(user!.id), context.previousTracks);
      }
      
      toast({
        title: "Ошибка лайка",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: ({ trackId, newCount }) => {
      // Ensure the final state is correct
      queryClient.setQueryData<Track[]>(
        trackQueryKeys.user(user!.id),
        (old) => old?.map(track => 
          track.id === trackId ? { ...track, like_count: newCount } : track
        ) || []
      );
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

  // Set up real-time updates with error handling
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
          try {
            // Update specific track in cache
            const updatedTrack = transformTrack(payload.new);
            queryClient.setQueryData<Track[]>(
              trackQueryKeys.user(user.id),
              (old) => old?.map(track => 
                track.id === updatedTrack.id ? updatedTrack : track
              ) || []
            );
          } catch (error) {
            console.error('Error processing real-time update:', error);
            // Fallback to full refresh
            queryClient.invalidateQueries({ queryKey: trackQueryKeys.user(user.id) });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    tracks,
    isLoading: tracksQuery.isLoading,
    error: tracksQuery.error?.message || null,
    isRefetching: tracksQuery.isRefetching,
    
    // Actions with proper loading states
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