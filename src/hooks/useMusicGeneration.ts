import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  // Poll for job status updates
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('generation_jobs')
        .select(`
          *,
          tracks (
            id,
            title,
            file_url,
            artwork_url,
            duration,
            created_at
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error polling job status:', error);
        return;
      }

      if (data) {
        const job: GenerationJob = {
          id: data.id,
          status: data.status as any,
          progress: data.progress,
          track: data.tracks ? {
            id: data.tracks.id,
            title: data.tracks.title,
            file_url: data.tracks.file_url,
            artwork_url: data.tracks.artwork_url,
            duration: data.tracks.duration,
            created_at: data.tracks.created_at
          } : undefined
        };

        setCurrentJob(job);

        if (job.status === 'completed') {
          setIsGenerating(false);
          toast({
            title: "Генерация завершена!",
            description: job.track ? `Трек "${job.track.title}" готов к прослушиванию` : "Трек готов к прослушиванию"
          });
        } else if (job.status === 'failed') {
          setIsGenerating(false);
          toast({
            title: "Ошибка генерации",
            description: data.error_message || "Произошла ошибка при генерации",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error in pollJobStatus:', error);
    }
  }, [toast]);

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

      // Start polling for updates
      const pollInterval = setInterval(async () => {
        await pollJobStatus(data.jobId);
      }, 3000); // Poll every 3 seconds

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsGenerating(false);
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
  }, []);

  return {
    generateMusic,
    resetGeneration,
    isGenerating,
    currentJob
  };
}