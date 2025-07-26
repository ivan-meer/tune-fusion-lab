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

      // Check if generation was successful and set the job state
      if (data.job) {
        console.log('Generation completed, job status:', data.job.status);
        
        if (data.job.status === 'completed' && data.job.tracks) {
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
          
          toast({
            title: "Генерация завершена!",
            description: `Трек "${track.title}" готов к прослушиванию`
          });
        } else if (data.job.status === 'completed') {
          setCurrentJob({
            id: data.job.id,
            status: 'completed',
            progress: 100
          });
          
          toast({
            title: "Генерация завершена!",
            description: "Трек готов к прослушиванию"
          });
        } else if (data.job.status === 'failed') {
          setCurrentJob({
            id: data.job.id,
            status: 'failed',
            progress: 0
          });
          
          toast({
            title: "Ошибка генерации",
            description: data.job.error_message || "Произошла ошибка при генерации",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Генерация завершена!",
          description: "Трек готов к прослушиванию"
        });
      }
      
      setIsGenerating(false);
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