/**
 * Audio Preview Component
 * 
 * Компонент для предварительного прослушивания аудио файлов
 * перед их загрузкой в систему
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX,
  SkipForward,
  SkipBack,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioPreviewProps {
  file: File;
  className?: string;
  onError?: (error: string) => void;
  autoplay?: boolean;
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function AudioPreview({ 
  file, 
  className, 
  onError, 
  autoplay = false 
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileUrlRef = useRef<string | null>(null);

  // Create audio URL from file
  useEffect(() => {
    if (file) {
      // Revoke previous URL to prevent memory leaks
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
      }
      
      fileUrlRef.current = URL.createObjectURL(file);
      
      if (audioRef.current) {
        audioRef.current.src = fileUrlRef.current;
        audioRef.current.load();
      }
    }

    // Cleanup on unmount
    return () => {
      if (fileUrlRef.current) {
        URL.revokeObjectURL(fileUrlRef.current);
      }
    };
  }, [file]);

  // Audio event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      
      if (autoplay) {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.warn('Autoplay failed:', err);
            setError('Автовоспроизведение заблокировано браузером');
          });
      }
    }
  }, [autoplay]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const handleError = useCallback((e: Event) => {
    const target = e.target as HTMLAudioElement;
    const errorMessage = `Ошибка воспроизведения: ${target.error?.message || 'неизвестная ошибка'}`;
    setError(errorMessage);
    setIsLoading(false);
    onError?.(errorMessage);
  }, [onError]);

  // Setup audio element event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [handleLoadedMetadata, handleTimeUpdate, handleEnded, handleError]);

  // Control functions
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Play/pause error:', err);
      setError('Ошибка воспроизведения');
    }
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  const handleSeek = useCallback((newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const handleSkipForward = useCallback(() => {
    if (audioRef.current) {
      const newTime = Math.min(currentTime + 10, duration);
      handleSeek(newTime);
    }
  }, [currentTime, duration, handleSeek]);

  const handleSkipBack = useCallback(() => {
    if (audioRef.current) {
      const newTime = Math.max(currentTime - 10, 0);
      handleSeek(newTime);
    }
  }, [currentTime, handleSeek]);

  // Get file format and info
  const fileExtension = file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN';
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Volume2 className="h-5 w-5" />
          Предварительное прослушивание
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Info */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{fileExtension}</Badge>
          <Badge variant="outline">{formatFileSize(file.size)}</Badge>
          <span className="text-muted-foreground">{file.name}</span>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Audio Element */}
        <audio
          ref={audioRef}
          preload="metadata"
          className="hidden"
        />

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="relative">
            <Progress value={progressPercentage} className="h-2" />
            <div
              className="absolute top-0 left-0 right-0 h-2 cursor-pointer"
              onClick={(e) => {
                if (duration > 0) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newTime = (clickX / rect.width) * duration;
                  handleSeek(newTime);
                }
              }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSkipBack}
            disabled={isLoading || error !== null}
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant={isPlaying ? "secondary" : "default"}
            onClick={togglePlayPause}
            disabled={isLoading || error !== null}
            className="px-6"
          >
            {isLoading ? (
              <RotateCcw className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSkipForward}
            disabled={isLoading || error !== null}
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleStop}
            disabled={isLoading || error !== null}
          >
            <Square className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 ml-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleMute}
              disabled={isLoading || error !== null}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              disabled={isLoading || error !== null}
            />
          </div>
        </div>

        {/* Additional Info */}
        {duration > 0 && (
          <div className="text-xs text-muted-foreground text-center">
            Длительность: {formatTime(duration)} • Качество: {Math.round(file.size / duration / 1000)}kb/s
          </div>
        )}
      </CardContent>
    </Card>
  );
}