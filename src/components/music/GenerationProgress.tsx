import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  Download,
  Play,
  Sparkles
} from 'lucide-react';
import { GenerationJob } from '@/hooks/useMusicGeneration';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import GenerationSteps, { GenerationStep } from './GenerationSteps';
import { cn } from '@/lib/utils';

interface GenerationProgressProps {
  job: GenerationJob;
  onReset: () => void;
  onRetry?: () => void;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Ожидание'
  },
  processing: {
    icon: RefreshCw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Обработка'
  },
  completed: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Завершено'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Ошибка'
  }
};

export default function GenerationProgress({ job, onReset, onRetry }: GenerationProgressProps) {
  const [animateProgress, setAnimateProgress] = useState(false);
  const [playerState, playerActions] = useAudioPlayer();
  const config = statusConfig[job.status];
  const Icon = config.icon;

  useEffect(() => {
    if (job.status === 'processing') {
      setAnimateProgress(true);
      const timer = setTimeout(() => setAnimateProgress(false), 500);
      return () => clearTimeout(timer);
    }
  }, [job.progress]);

  return (
    <Card className={`${config.borderColor} border-2`}>
      <CardHeader className={`${config.bgColor} rounded-t-lg`}>
        <CardTitle className="flex items-center gap-3">
          <Icon 
            className={`h-5 w-5 ${config.color} ${job.status === 'processing' ? 'animate-spin' : ''}`}
          />
          <span className={config.color}>Генерация музыки</span>
          <Badge variant="outline" className={`ml-auto ${config.color}`}>
            {config.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Прогресс</span>
            <span className={config.color}>{Math.round(job.progress)}%</span>
          </div>
          <Progress 
            value={job.progress} 
            className={`h-3 transition-all duration-300 ${animateProgress ? 'scale-105' : ''}`}
          />
        </div>

        {/* Status Message */}
        <div className="text-sm text-muted-foreground">
          {job.status === 'pending' && (
            <p>Задача поставлена в очередь и ожидает обработки...</p>
          )}
          {job.status === 'processing' && (
            <p>ИИ создает уникальную композицию на основе вашего запроса...</p>
          )}
          {job.status === 'completed' && job.track && (
            <div className="space-y-3">
              <p className="text-green-700 font-medium">
                🎉 Ваш трек готов! Теперь вы можете прослушать его в библиотеке.
              </p>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-3">
                  <Music className="h-8 w-8 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">{job.track.title}</h4>
                    <p className="text-sm text-green-700">
                      Длительность: {Math.floor((job.track.duration || 0) / 60)}:{((job.track.duration || 0) % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {job.status === 'completed' && !job.track && (
            <p className="text-green-700 font-medium">
              Генерация завершена! Обновите библиотеку, чтобы увидеть новый трек.
            </p>
          )}
          {job.status === 'failed' && (
            <div className="space-y-3">
              <p className="text-red-700 font-medium">
                ❌ Произошла ошибка при генерации. Попробуйте еще раз.
              </p>
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-700">
                  Возможные причины: перегрузка сервисов ИИ, проблемы с интернет-соединением, 
                  или некорректный промпт. Попробуйте изменить описание или выбрать другого провайдера.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {job.status === 'completed' && job.track && (
            <Button 
              onClick={() => playerActions.playTrack({
                id: job.track.id,
                title: job.track.title,
                file_url: job.track.file_url,
                duration: job.track.duration,
                tags: [],
                is_public: false,
                provider: 'suno' as const,
                play_count: 0,
                like_count: 0,
                created_at: job.track.created_at,
                updated_at: job.track.created_at
              })}
              variant="default" 
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              Прослушать трек
            </Button>
          )}
          {job.status === 'completed' && (
            <Button onClick={onReset} variant="outline" className="flex-1">
              <Music className="h-4 w-4 mr-2" />
              Создать новый трек
            </Button>
          )}
          
          {job.status === 'failed' && (
            <>
              {onRetry && (
                <Button onClick={onRetry} variant="default" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Попробовать снова
                </Button>
              )}
              <Button onClick={onReset} variant="outline" className="flex-1">
                Создать новый
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}