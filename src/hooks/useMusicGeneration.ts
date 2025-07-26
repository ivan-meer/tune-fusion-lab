import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GenerationRequest {
  prompt: string;
  provider: 'suno' | 'mureka';
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

  const generateMusic = useCallback(async (request: GenerationRequest) => {
    try {
      setIsGenerating(true);
      
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

      // Check if we have completed job data immediately
      if (data.job && data.job.status === 'completed' && data.job.tracks) {
        console.log('Generation completed immediately');
        const track = Array.isArray(data.job.tracks) ? data.job.tracks[0] : data.job.tracks;
        
        setCurrentJob({
          id: data.job.id,
          status: 'completed',
          progress: 100,
          track: {
            id: track.id,
            title: track.title,
            file_url: track.file_url,
            artwork_url: track.artwork_url,
            duration: track.duration,
            created_at: track.created_at
          }
        });
        
        setIsGenerating(false);
        
        toast({
          title: "Генерация завершена!",
          description: `Трек "${track.title}" готов к прослушиванию`
        });
        
        return data;
      }

      // If generation is still in progress, start polling
      const jobId = data.jobId;
      setCurrentJob({
        id: jobId,
        status: 'processing',
        progress: 10
      });

      // Poll for updates
      const pollInterval = setInterval(async () => {
        try {
          const { data: statusData, error: statusError } = await supabase.functions.invoke(
            'get-generation-status',
            {
              body: { jobId }
            }
          );

          if (statusError || !statusData?.success) {
            console.error('Failed to get generation status:', statusError);
            return;
          }

          const job = statusData.job;
          console.log('Job status update:', job);
          
          setCurrentJob({
            id: job.id,
            status: job.status,
            progress: job.progress || 0,
            track: job.track_id ? {
              id: job.track_id,
              title: job.response_data?.title || 'Generated Track',
              file_url: job.response_data?.audioUrl,
              artwork_url: job.response_data?.imageUrl,
              duration: job.response_data?.duration || 120,
              created_at: new Date().toISOString()
            } : undefined
          });

          if (job.status === 'completed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
            
            toast({
              title: "Генерация завершена!",
              description: `Трек "${job.tracks?.title}" готов к прослушиванию`
            });
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            setIsGenerating(false);
            
            toast({
              title: "Ошибка генерации",
              description: job.error_message || "Произошла ошибка при создании трека",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error polling generation status:', error);
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup after 5 minutes
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
      }, 300000); // 5 minutes

      return data;
      
    } catch (error) {
      setIsGenerating(false);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      toast({
        title: "Ошибка генерации",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw error;
    }
  }, [toast, isGenerating]);

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