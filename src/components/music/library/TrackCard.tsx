/**
 * Optimized TrackCard Component
 * 
 * Performance-optimized version with React.memo, proper memoization,
 * and efficient event handling
 */

import React, { memo, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  Play, 
  Pause, 
  Download, 
  Share, 
  Trash2, 
  Heart,
  Clock,
  Eye,
  Volume2,
  Loader2
} from 'lucide-react';
import { Track } from '@/hooks/useUserTracks';
import { cn } from '@/lib/utils';

// Utility functions
const formatDuration = (seconds?: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Memoized artwork component
const TrackArtwork = memo<{
  track: Track;
  size: 'small' | 'large';
  className?: string;
}>(({ track, size, className }) => {
  const sizeClasses = useMemo(() => ({
    small: 'w-12 h-12',
    large: 'w-full h-full'
  }), []);

  return (
    <div className={cn(sizeClasses[size], "relative overflow-hidden rounded", className)}>
      {track.artwork_url ? (
        <img 
          src={track.artwork_url} 
          alt={track.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Music className={cn(
            size === 'small' ? 'w-6 h-6' : 'w-12 h-12',
            'text-primary'
          )} />
        </div>
      )}
    </div>
  );
});

TrackArtwork.displayName = 'TrackArtwork';

// Memoized action buttons component
const ActionButtons = memo<{
  track: Track;
  onLike: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  size?: 'sm' | 'default';
  orientation?: 'horizontal' | 'vertical';
  isLiking?: boolean;
  isDeleting?: boolean;
}>(({ 
  track, 
  onLike, 
  onDelete, 
  onDownload, 
  onShare, 
  size = 'sm',
  orientation = 'horizontal',
  isLiking = false,
  isDeleting = false
}) => {
  const containerClass = useMemo(() => 
    orientation === 'horizontal' 
      ? 'flex items-center gap-1' 
      : 'flex flex-col gap-1',
    [orientation]
  );

  const handleDownload = useCallback(() => {
    if (onDownload) {
      onDownload();
    } else if (track.file_url) {
      const link = document.createElement('a');
      link.href = track.file_url;
      link.download = `${track.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [onDownload, track.file_url, track.title]);

  const handleShare = useCallback(async () => {
    if (onShare) {
      onShare();
    } else if (track.file_url) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: track.title,
            text: `Послушайте этот трек: ${track.title}`,
            url: track.file_url
          });
        } else {
          await navigator.clipboard?.writeText(track.file_url);
        }
      } catch (err) {
        console.warn('Share failed:', err);
      }
    }
  }, [onShare, track.file_url, track.title]);

  return (
    <div className={containerClass}>
      <Button 
        size={size} 
        variant="ghost" 
        onClick={onLike}
        disabled={isLiking}
        aria-label="Поставить лайк"
        title={`Лайков: ${track.like_count}`}
      >
        {isLiking ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Heart className="w-3 h-3" />
        )}
      </Button>
      
      <Button 
        size={size} 
        variant="ghost" 
        onClick={handleDownload}
        disabled={!track.file_url}
        aria-label="Скачать трек"
      >
        <Download className="w-3 h-3" />
      </Button>
      
      <Button 
        size={size} 
        variant="ghost" 
        onClick={handleShare}
        disabled={!track.file_url}
        aria-label="Поделиться"
      >
        <Share className="w-3 h-3" />
      </Button>
      
      <Button 
        size={size} 
        variant="ghost" 
        onClick={onDelete}
        disabled={isDeleting}
        className="text-destructive hover:text-destructive"
        aria-label="Удалить трек"
      >
        {isDeleting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Trash2 className="w-3 h-3" />
        )}
      </Button>
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

// Memoized play button overlay
const PlayButtonOverlay = memo<{
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onPlay: () => void;
  className?: string;
}>(({ isPlaying, isCurrentTrack, onPlay, className }) => {
  return (
    <Button
      size="sm"
      variant={isCurrentTrack ? "default" : "secondary"}
      className={cn(
        "absolute",
        isCurrentTrack 
          ? "opacity-100" 
          : "opacity-0 group-hover:opacity-100 transition-opacity",
        className
      )}
      onClick={onPlay}
      aria-label={isPlaying ? "Пауза" : "Воспроизведение"}
    >
      {isPlaying ? (
        <Pause className="w-4 h-4" />
      ) : (
        <Play className="w-4 h-4" />
      )}
      {isCurrentTrack && <Volume2 className="w-3 h-3 ml-1" />}
    </Button>
  );
});

PlayButtonOverlay.displayName = 'PlayButtonOverlay';

// List view layout component
const ListViewLayout = memo<OptimizedTrackCardProps>(({ 
  track, 
  isCurrentlyPlaying, 
  isPlaying,
  onLike, 
  onDelete, 
  onDownload, 
  onShare, 
  onPlay,
  isLiking,
  isDeleting,
  className 
}) => {
  const isCurrentTrack = isCurrentlyPlaying;

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 border rounded-lg transition-all duration-200",
      "hover:bg-muted/50 hover:border-primary/20",
      isCurrentTrack && "bg-primary/5 border-primary/30",
      className
    )}>
      <div className="relative group">
        <TrackArtwork track={track} size="small" />
        <PlayButtonOverlay
          isPlaying={isPlaying || false}
          isCurrentTrack={isCurrentTrack || false}
          onPlay={onPlay || (() => {})}
          className="inset-0"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          "font-medium truncate transition-colors",
          isCurrentTrack && "text-primary"
        )}>
          {track.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {track.provider}
          </Badge>
          {track.genre && <span>{track.genre}</span>}
          <span>{formatDuration(track.duration)}</span>
        </div>
      </div>
      
      <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Heart className="w-4 h-4" />
          {track.like_count}
        </div>
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          {track.play_count}
        </div>
        <span>{formatDate(track.created_at)}</span>
      </div>
      
      <ActionButtons
        track={track}
        onLike={onLike}
        onDelete={onDelete}
        onDownload={onDownload}
        onShare={onShare}
        isLiking={isLiking}
        isDeleting={isDeleting}
      />
    </div>
  );
});

ListViewLayout.displayName = 'ListViewLayout';

// Grid view layout component
const GridViewLayout = memo<OptimizedTrackCardProps>(({ 
  track, 
  isCurrentlyPlaying, 
  isPlaying,
  onLike, 
  onDelete, 
  onDownload, 
  onShare, 
  onPlay,
  isLiking,
  isDeleting,
  className 
}) => {
  const isCurrentTrack = isCurrentlyPlaying;

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-lg",
      isCurrentTrack && "ring-2 ring-primary ring-opacity-50",
      className
    )}>
      <CardContent className="p-4">
        <div className="aspect-square relative mb-3 group">
          <TrackArtwork track={track} size="large" />
          <PlayButtonOverlay
            isPlaying={isPlaying || false}
            isCurrentTrack={isCurrentTrack || false}
            onPlay={onPlay || (() => {})}
            className="bottom-2 right-2"
          />
        </div>
        
        <div className="space-y-2">
          <h3 className={cn(
            "font-medium truncate transition-colors",
            isCurrentTrack && "text-primary"
          )} title={track.title}>
            {track.title}
          </h3>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {track.provider}
              </Badge>
              {track.genre && <span className="text-xs">{track.genre}</span>}
            </div>
            <span className="text-xs">{formatDuration(track.duration)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {track.like_count}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {track.play_count}
              </div>
            </div>
            
            <ActionButtons
              track={track}
              onLike={onLike}
              onDelete={onDelete}
              onDownload={onDownload}
              onShare={onShare}
              size="sm"
              isLiking={isLiking}
              isDeleting={isDeleting}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

GridViewLayout.displayName = 'GridViewLayout';

// Main component props
export interface OptimizedTrackCardProps {
  track: Track;
  viewMode: 'grid' | 'list';
  isCurrentlyPlaying?: boolean;
  isPlaying?: boolean;
  onLike: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onPlay?: () => void;
  isLiking?: boolean;
  isDeleting?: boolean;
  className?: string;
}

// Main optimized track card component
const OptimizedTrackCard = memo<OptimizedTrackCardProps>(({
  track,
  viewMode,
  isCurrentlyPlaying,
  isPlaying,
  onLike,
  onDelete,
  onDownload,
  onShare,
  onPlay,
  isLiking,
  isDeleting,
  className
}) => {
  // Memoize common props to prevent unnecessary re-renders
  const commonProps = useMemo(() => ({
    track,
    viewMode,
    isCurrentlyPlaying,
    isPlaying,
    onLike,
    onDelete,
    onDownload,
    onShare,
    onPlay,
    isLiking,
    isDeleting,
    className
  }), [
    track,
    viewMode,
    isCurrentlyPlaying,
    isPlaying,
    onLike,
    onDelete,
    onDownload,
    onShare,
    onPlay,
    isLiking,
    isDeleting,
    className
  ]);

  if (viewMode === 'list') {
    return <ListViewLayout {...commonProps} />;
  }

  return <GridViewLayout {...commonProps} />;
});

OptimizedTrackCard.displayName = 'OptimizedTrackCard';

export default OptimizedTrackCard;