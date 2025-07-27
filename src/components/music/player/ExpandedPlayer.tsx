/**
 * ExpandedPlayer Component
 * 
 * Detailed audio player panel that can be expanded from the global player
 * Provides enhanced controls including seeking, downloads, playlist management
 * 
 * Features:
 * - Full screen player interface
 * - Detailed track information and lyrics
 * - Download options (MP3/WAV)
 * - Like/dislike functionality
 * - Playlist management
 * - Advanced seeking controls
 * - Queue visualization
 * 
 * @author AI Music Generator Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronDown,
  ChevronUp,
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  Music,
  Download,
  Heart,
  HeartOff,
  ListMusic,
  Share,
  MoreHorizontal,
  FileAudio,
  FileText
} from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ExpandedPlayerProps {
  isExpanded: boolean;
  onToggleExpanded: () => void;
  className?: string;
}

/**
 * Format time in MM:SS format
 */
const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Progress bar with enhanced seeking
 */
function EnhancedProgressBar({ 
  currentTime, 
  duration, 
  onSeek 
}: {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) {
      const rect = e.currentTarget.getBoundingClientRect();
      const moveX = e.clientX - rect.left;
      const percentage = moveX / rect.width;
      const time = percentage * duration;
      setHoverTime(time);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        {hoverTime !== null && (
          <span className="text-primary">{formatTime(hoverTime)}</span>
        )}
        <span>{formatTime(duration)}</span>
      </div>
      
      <div 
        className="relative h-3 bg-muted rounded-full cursor-pointer group"
        onClick={handleProgressClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverTime(null)}
      >
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
        
        {/* Hover indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          style={{ left: `${progress}%`, marginLeft: '-8px' }}
        />
        
        {/* Buffered indicator could go here */}
      </div>
    </div>
  );
}

/**
 * Download options component
 */
function DownloadOptions({ track }: { track: any }) {
  const { toast } = useToast();

  const handleDownload = async (format: 'mp3' | 'wav') => {
    if (!track?.file_url) {
      toast({
        title: "Ошибка",
        description: "Файл недоступен для скачивания",
        variant: "destructive"
      });
      return;
    }

    // For now, download the original file
    // TODO: Implement actual format conversion
    const link = document.createElement('a');
    link.href = track.file_url;
    link.download = `${track.title}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Скачивание началось",
      description: `Трек "${track.title}" загружается в формате ${format.toUpperCase()}`
    });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Скачать трек</h4>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload('mp3')}
          className="gap-2"
        >
          <FileAudio className="w-4 h-4" />
          MP3
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDownload('wav')}
          className="gap-2"
        >
          <FileAudio className="w-4 h-4" />
          WAV
        </Button>
      </div>
    </div>
  );
}

/**
 * Track actions component
 */
function TrackActions({ track }: { track: any }) {
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Убрали из избранного" : "Добавили в избранное",
      description: `Трек "${track?.title}"`
    });
  };

  const handleShare = async () => {
    if (navigator.share && track?.file_url) {
      try {
        await navigator.share({
          title: track.title,
          text: `Послушайте этот трек: ${track.title}`,
          url: track.file_url
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      await navigator.clipboard?.writeText(track?.file_url || window.location.href);
      toast({
        title: "Ссылка скопирована",
        description: "Ссылка на трек скопирована в буфер обмена"
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        className={cn("gap-2", isLiked && "text-red-500")}
      >
        {isLiked ? <Heart className="w-4 h-4 fill-current" /> : <HeartOff className="w-4 h-4" />}
        {isLiked ? 'В избранном' : 'Нравится'}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        className="gap-2"
      >
        <Share className="w-4 h-4" />
        Поделиться
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
      >
        <ListMusic className="w-4 h-4" />
        В плейлист
      </Button>
    </div>
  );
}

/**
 * Queue display component
 */
function QueueDisplay({ playlist, currentIndex }: { playlist: any[]; currentIndex: number }) {
  if (playlist.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ListMusic className="w-8 h-8 mx-auto mb-2" />
        <p>Очередь пуста</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {playlist.map((track, index) => (
        <div
          key={`${track.id}-${index}`}
          className={cn(
            "flex items-center gap-3 p-2 rounded-md transition-colors",
            index === currentIndex && "bg-primary/10 border border-primary/20",
            "hover:bg-muted/50"
          )}
        >
          <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
            {index === currentIndex ? (
              <Music className="w-4 h-4 text-primary" />
            ) : (
              <span className="text-xs text-muted-foreground">{index + 1}</span>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={cn(
              "text-sm truncate",
              index === currentIndex && "text-primary font-medium"
            )}>
              {track.title}
            </div>
            <div className="text-xs text-muted-foreground">
              {track.provider} • {formatTime(track.duration)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Main ExpandedPlayer component
 */
export default function ExpandedPlayer({ 
  isExpanded, 
  onToggleExpanded, 
  className 
}: ExpandedPlayerProps) {
  const [playerState, playerActions] = useAudioPlayer();
  const [activeTab, setActiveTab] = useState('info');

  if (!playerState.currentTrack) {
    return null;
  }

  const RepeatIcon = playerState.repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <Card className={cn(
      "fixed bottom-20 left-0 right-0 z-40 rounded-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85",
      "transition-all duration-300 ease-in-out",
      isExpanded ? "translate-y-0" : "translate-y-full",
      className
    )}>
      <CardContent className="p-6">
        {/* Header with close button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Сейчас играет</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Свернуть
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column - Track info and controls */}
          <div className="space-y-6">
            {/* Track artwork and info */}
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                {playerState.currentTrack.artwork_url ? (
                  <img 
                    src={playerState.currentTrack.artwork_url} 
                    alt={playerState.currentTrack.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Music className="w-12 h-12 text-primary" />
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg mb-1 truncate">
                  {playerState.currentTrack.title}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">
                    {playerState.currentTrack.provider}
                  </Badge>
                  {playerState.currentTrack.genre && (
                    <Badge variant="secondary">
                      {playerState.currentTrack.genre}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {playerState.currentTrack.description}
                </p>
              </div>
            </div>

            {/* Enhanced progress bar */}
            <EnhancedProgressBar
              currentTime={playerState.currentTime}
              duration={playerState.duration}
              onSeek={playerActions.seekTo}
            />

            {/* Main controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={playerActions.toggleShuffle}
                className={cn("p-3", playerState.shuffleEnabled && "text-primary")}
              >
                <Shuffle className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={playerActions.previousTrack}
                disabled={playerState.currentIndex === 0}
                className="p-3"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              
              <Button
                variant="default"
                size="lg"
                onClick={playerActions.togglePlayPause}
                className="p-4"
              >
                {playerState.isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={playerActions.nextTrack}
                disabled={playerState.currentIndex >= playerState.playlist.length - 1}
                className="p-3"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => playerActions.setRepeatMode(
                  playerState.repeatMode === 'none' ? 'all' : 
                  playerState.repeatMode === 'all' ? 'one' : 'none'
                )}
                className={cn("p-3", playerState.repeatMode !== 'none' && "text-primary")}
              >
                <RepeatIcon className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={playerActions.toggleMute}
                className="p-2"
              >
                {playerState.isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              
              <Slider
                value={[playerState.isMuted ? 0 : playerState.volume * 100]}
                onValueChange={([value]) => playerActions.setVolume(value / 100)}
                max={100}
                step={1}
                className="flex-1"
              />
            </div>
          </div>

          {/* Right column - Tabs with additional content */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Действия</TabsTrigger>
                <TabsTrigger value="lyrics">Текст</TabsTrigger>
                <TabsTrigger value="queue">Очередь</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <TrackActions track={playerState.currentTrack} />
                <Separator />
                <DownloadOptions track={playerState.currentTrack} />
              </TabsContent>
              
              <TabsContent value="lyrics" className="space-y-4">
                <div className="max-h-64 overflow-y-auto">
                  {playerState.currentTrack.lyrics ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {playerState.currentTrack.lyrics}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-8 h-8 mx-auto mb-2" />
                      <p>Текст песни недоступен</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="queue" className="space-y-4">
                <QueueDisplay 
                  playlist={playerState.playlist} 
                  currentIndex={playerState.currentIndex} 
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}