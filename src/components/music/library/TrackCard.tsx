/**
 * TrackCard Component
 * 
 * Reusable component for displaying track information in both grid and list views
 * Provides interactive controls for playback, liking, downloading, and deletion
 * 
 * Features:
 * - Responsive grid and list layouts
 * - Integrated playback controls with global player
 * - Track metadata display with badges
 * - Action buttons (like, download, share, delete)
 * - Visual feedback for current playing state
 * - Optimized for both mobile and desktop
 * 
 * @author AI Music Generator Team
 * @version 1.0.0
 */

import React from 'react';
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
  Volume2
} from 'lucide-react';
import { Track } from '@/hooks/useUserTracks';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { cn } from '@/lib/utils';

/**
 * Props interface for TrackCard component
 */
export interface TrackCardProps {
  /** Track data to display */
  track: Track;
  /** View mode for responsive layouts */
  viewMode: 'grid' | 'list';
  /** Whether this track is currently playing globally */
  isCurrentlyPlaying?: boolean;
  /** Callback when user likes/unlikes track */
  onLike: () => void;
  /** Callback when user requests track deletion */
  onDelete: () => void;
  /** Callback when user downloads track */
  onDownload?: () => void;
  /** Callback when user shares track */
  onShare?: () => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Utility function to format duration in MM:SS format
 * 
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
const formatDuration = (seconds?: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Utility function to format date in localized format
 * 
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Track artwork component with fallback
 */
interface TrackArtworkProps {
  track: Track;
  size: 'small' | 'large';
  className?: string;
}

function TrackArtwork({ track, size, className }: TrackArtworkProps) {
  const sizeClasses = {
    small: 'w-12 h-12',
    large: 'w-full h-full'
  };

  return (
    <div className={cn(sizeClasses[size], "relative overflow-hidden rounded", className)}>
      {track.artwork_url ? (
        <img 
          src={track.artwork_url} 
          alt={track.title}
          className="w-full h-full object-cover"
          loading="lazy"
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
}

/**
 * Action buttons component
 * Handles like, download, share, and delete actions
 */
interface ActionButtonsProps {
  track: Track;
  onLike: () => void;
  onDelete: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  size?: 'sm' | 'default';
  orientation?: 'horizontal' | 'vertical';
}

function ActionButtons({ 
  track, 
  onLike, 
  onDelete, 
  onDownload, 
  onShare, 
  size = 'sm',
  orientation = 'horizontal'
}: ActionButtonsProps) {
  const containerClass = orientation === 'horizontal' 
    ? 'flex items-center gap-1' 
    : 'flex flex-col gap-1';

  /**
   * Handle download action
   * TODO: Implement actual file download logic
   */
  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else if (track.file_url) {
      // HACK: Simple download using anchor link
      const link = document.createElement('a');
      link.href = track.file_url;
      link.download = `${track.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  /**
   * Handle share action
   * TODO: Implement proper sharing with Web Share API
   */
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // HACK: Simple clipboard copy as fallback
      if (navigator.share && track.file_url) {
        navigator.share({
          title: track.title,
          text: `Послушайте этот трек: ${track.title}`,
          url: track.file_url
        }).catch(console.error);
      } else {
        // Fallback to copying link
        navigator.clipboard?.writeText(track.file_url || window.location.href);
      }
    }
  };

  return (
    <div className={containerClass}>
      <Button 
        size={size} 
        variant="ghost" 
        onClick={onLike}
        aria-label="Поставить лайк"
        title={`Лайков: ${track.like_count}`}
      >
        <Heart className="w-3 h-3" />
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
        className="text-destructive hover:text-destructive"
        aria-label="Удалить трек"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

/**
 * Play button overlay component
 * Shows play/pause button on hover and when active
 */
interface PlayButtonOverlayProps {
  isPlaying: boolean;
  isCurrentTrack: boolean;
  onPlay: () => void;
  onPause: () => void;
  className?: string;
}

function PlayButtonOverlay({ 
  isPlaying, 
  isCurrentTrack, 
  onPlay, 
  onPause, 
  className 
}: PlayButtonOverlayProps) {
  const showOverlay = isCurrentTrack || 'group-hover';

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
      onClick={isPlaying ? onPause : onPlay}
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
}

/**
 * List view layout component
 * Compact horizontal layout for list view
 */
function ListViewLayout({ 
  track, 
  isCurrentlyPlaying, 
  onLike, 
  onDelete, 
  onDownload, 
  onShare, 
  playerActions,
  className 
}: TrackCardProps & { playerActions: any }) {
  const [playerState] = useAudioPlayer();
  const isCurrentTrack = playerState.currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && playerState.isPlaying;

  /**
   * Handle track playback
   * Either plays this track or pauses if already playing
   */
  const handlePlay = () => {
    if (isCurrentTrack) {
      playerActions.togglePlayPause();
    } else {
      playerActions.playTrack(track);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-4 p-4 border rounded-lg transition-all duration-200",
      "hover:bg-muted/50 hover:border-primary/20",
      isCurrentTrack && "bg-primary/5 border-primary/30",
      className
    )}>
      {/* Track artwork with play button */}
      <div className="relative group">
        <TrackArtwork track={track} size="small" />
        <PlayButtonOverlay
          isPlaying={isPlaying}
          isCurrentTrack={isCurrentTrack}
          onPlay={handlePlay}
          onPause={playerActions.togglePlayPause}
          className="inset-0"
        />
      </div>
      
      {/* Track information */}
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
      
      {/* Stats */}
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
      
      {/* Action buttons */}
      <ActionButtons
        track={track}
        onLike={onLike}
        onDelete={onDelete}
        onDownload={onDownload}
        onShare={onShare}
      />
    </div>
  );
}

/**
 * Grid view layout component
 * Card-based vertical layout for grid view
 */
function GridViewLayout({ 
  track, 
  isCurrentlyPlaying, 
  onLike, 
  onDelete, 
  onDownload, 
  onShare, 
  playerActions,
  className 
}: TrackCardProps & { playerActions: any }) {
  const [playerState] = useAudioPlayer();
  const isCurrentTrack = playerState.currentTrack?.id === track.id;
  const isPlaying = isCurrentTrack && playerState.isPlaying;

  /**
   * Handle track playback
   */
  const handlePlay = () => {
    if (isCurrentTrack) {
      playerActions.togglePlayPause();
    } else {
      playerActions.playTrack(track);
    }
  };

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-lg",
      isCurrentTrack && "ring-2 ring-primary ring-opacity-50",
      className
    )}>
      <CardContent className="p-4">
        {/* Track artwork */}
        <div className="aspect-square relative mb-3 group">
          <TrackArtwork track={track} size="large" />
          <PlayButtonOverlay
            isPlaying={isPlaying}
            isCurrentTrack={isCurrentTrack}
            onPlay={handlePlay}
            onPause={playerActions.togglePlayPause}
            className="bottom-2 right-2"
          />
        </div>
        
        {/* Track information */}
        <div className="space-y-2">
          <h3 className={cn(
            "font-medium truncate transition-colors",
            isCurrentTrack && "text-primary"
          )} title={track.title}>
            {track.title}
          </h3>
          
          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {track.provider}
              </Badge>
              {track.genre && <span className="text-xs">{track.genre}</span>}
            </div>
            <span className="text-xs">{formatDuration(track.duration)}</span>
          </div>
          
          {/* Stats and actions */}
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
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main TrackCard component
 * 
 * Renders track information in either grid or list layout
 * Integrates with global audio player for seamless playback
 */
export default function TrackCard({
  track,
  viewMode,
  isCurrentlyPlaying,
  onLike,
  onDelete,
  onDownload,
  onShare,
  className
}: TrackCardProps) {
  const [playerState, playerActions] = useAudioPlayer();
  
  // Common props for both layouts
  const commonProps = {
    track,
    viewMode,
    isCurrentlyPlaying,
    onLike,
    onDelete,
    onDownload,
    onShare,
    playerActions,
    className
  };

  // Render appropriate layout based on view mode
  if (viewMode === 'list') {
    return <ListViewLayout {...commonProps} />;
  }

  return <GridViewLayout {...commonProps} />;
}

// TODO: Add drag and drop support for playlist management
// TODO: Add right-click context menu
// TODO: Add keyboard navigation support
// TODO: Add track selection for batch operations
// FIXME: Play button overlay positioning on small screens
// HACK: Using direct DOM manipulation for downloads