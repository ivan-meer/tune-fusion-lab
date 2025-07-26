import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealtimeUpdatesProps {
  onTrackUpdate?: () => void;
  onJobUpdate?: () => void;
}

export function useRealtimeUpdates({ onTrackUpdate, onJobUpdate }: UseRealtimeUpdatesProps) {
  useEffect(() => {
    // Subscribe to tracks table changes
    const tracksChannel = supabase
      .channel('tracks-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // FIXED: Only listen to new tracks, not URL updates
          schema: 'public',
          table: 'tracks'
        },
        (payload) => {
          console.log('New track added:', payload);
          onTrackUpdate?.();
        }
      )
      .subscribe();

    // Subscribe to generation_jobs table changes
    const jobsChannel = supabase
      .channel('jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'generation_jobs'
        },
        (payload) => {
          console.log('Job update:', payload);
          onJobUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tracksChannel);
      supabase.removeChannel(jobsChannel);
    };
  }, [onTrackUpdate, onJobUpdate]);
}