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
      
      const { data, error } = await supabase.functions.invoke('generate-music', {
        body: request
      });

      if (error) {
        throw new Error(error.message || 'Failed to start music generation');
      }

      if (!data.success) {
        throw new Error(data.error || 'Music generation failed');
      }

      // Start polling for status
      const jobId = data.jobId;
      setCurrentJob({
        id: jobId,
        status: 'processing',
        progress: 0
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

          if (statusError || !statusData.success) {
            console.error('Failed to get generation status:', statusError);
            return;
          }

          const job = statusData.job;
          setCurrentJob({
            id: job.id,
            status: job.status,
            progress: job.progress,
            track: job.tracks
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