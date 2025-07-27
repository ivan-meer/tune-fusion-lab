import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { useRealtimeProgress } from './useRealtimeProgress';
import { useUserTracks } from './useUserTracks';

export interface GenerationRequest {
  prompt: string;
  provider: 'suno' | 'mureka' | 'test';
  model?: string;
  style?: string;
  duration?: number;
  instrumental?: boolean;
  lyrics?: string;
}

export interface GenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  track?: {
    id: string;
    title: string;
    file_url: string;
    artwork_url: string;
    duration: number;
    created_at: string;
  };
}

export function useMusicGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const { connect: connectProgress, disconnect: disconnectProgress } = useRealtimeProgress();
  const { toast } = useToast();
  const { loadTracks } = useUserTracks();

  // Poll for job status updates using edge function
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      // Use the dedicated edge function for getting status
      const { data, error } = await supabase.functions.invoke('get-generation-status', {
        body: { jobId }
      });

      if (error) {
        console.error('Error polling job status:', error);
        return;
      }

      if (data?.success && data.job) {
        const jobData = data.job;
        const job: GenerationJob = {
          id: jobData.id,
          status: jobData.status as any,
          progress: jobData.progress,
          track: jobData.tracks ? {
            id: jobData.tracks.id,
            title: jobData.tracks.title,
            file_url: jobData.tracks.file_url,
            artwork_url: jobData.tracks.artwork_url,
            duration: jobData.tracks.duration,
            created_at: jobData.tracks.created_at
          } : undefined
        };

        setCurrentJob(job);

        if (job.status === 'completed') {
          setIsGenerating(false);
          toast({
            title: "Генерация завершена!",
            description: job.track ? `Трек "${job.track.title}" готов к прослушиванию` : "Трек готов к прослушиванию"
          });
          // Reload user tracks to show the new track
          await loadTracks();
          return true; // Stop polling
        } else if (job.status === 'failed') {
          setIsGenerating(false);
          toast({
            title: "Ошибка генерации",
            description: jobData.error_message || "Произошла ошибка при генерации",
            variant: "destructive"
          });
          return true; // Stop polling
        }
      }
      return false; // Continue polling
    } catch (error) {
      console.error('Error in pollJobStatus:', error);
      return false;
    }
  }, [toast, loadTracks]);

  // Setup realtime subscription for generation jobs
  useEffect(() => {
    if (!currentJob?.id) return;

    console.log('Setting up realtime subscription for job:', currentJob.id);
    
    const channel = supabase
      .channel('generation-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'generation_jobs',
          filter: `id=eq.${currentJob.id}`
        },
        async (payload) => {
          console.log('Realtime job update:', payload);
          const updatedJob = payload.new;
          
          if (updatedJob) {
            setCurrentJob(prev => prev ? {
              ...prev,
              status: updatedJob.status,
              progress: updatedJob.progress
            } : null);

            // Handle completion
            if (updatedJob.status === 'completed') {
              setIsGenerating(false);
              // Fetch track details and reload tracks
              try {
                await loadTracks();
              } catch (err) {
                console.error('Failed to reload tracks:', err);
              }
              pollJobStatus(updatedJob.id);
            } else if (updatedJob.status === 'failed') {
              setIsGenerating(false);
              toast({
                title: "Ошибка генерации",
                description: updatedJob.error_message || "Произошла ошибка при генерации",
                variant: "destructive"
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [currentJob?.id, toast, pollJobStatus]);

  const generateMusic = useCallback(async (request: GenerationRequest) => {
    try {
      setIsGenerating(true);
      setCurrentJob(null);
      
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Пользователь не аутентифицирован');
      }
      
      console.log('Calling generate-music function...');
      const { data, error } = await supabase.functions.invoke('generate-music', {
        body: request
      });

      console.log('Response:', { data, error });

      if (error) {
        throw new Error(error.message || 'Failed to start music generation');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Music generation failed');
      }

      // Set initial job state
      setCurrentJob({
        id: data.jobId,
        status: 'pending',
        progress: 0
      });

      toast({
        title: "Генерация начата",
        description: "Трек находится в процессе генерации..."
      });

      // Start polling for updates with automatic cleanup
      const pollInterval = setInterval(async () => {
        const shouldStop = await pollJobStatus(data.jobId);
        if (shouldStop) {
          clearInterval(pollInterval);
        }
      }, 2000); // Poll every 2 seconds for faster updates

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isGenerating) {
          setIsGenerating(false);
          toast({
            title: "Тайм-аут генерации",
            description: "Генерация заняла слишком много времени",
            variant: "destructive"
          });
        }
      }, 300000);
      
      return data;
      
    } catch (error) {
      setIsGenerating(false);
      setCurrentJob(null);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      toast({
        title: "Ошибка генерации",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  }, [toast, pollJobStatus]);

  const resetGeneration = useCallback(() => {
    setCurrentJob(null);
    setIsGenerating(false);
    disconnectProgress();
  }, [disconnectProgress]);

  return {
    generateMusic,
    resetGeneration,
    isGenerating,
    currentJob,
    connectProgress,
    disconnectProgress
  };
}