/**
 * GlobalAudioPlayer Component
 * 
 * Main audio player UI that appears at the bottom of the screen
 * Provides full music playback controls with modern, responsive design
 * 
 * Features:
 * - Play/pause, skip, previous controls
 * - Progress bar with seeking capability
 * - Volume control with mute
 * - Track information display
 * - Shuffle and repeat modes
 * - Responsive design for mobile and desktop
 * 
 * @author AI Music Generator Team
 * @version 1.0.0
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
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
  Loader2
} from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { cn } from '@/lib/utils';

/**
 * Progress bar component with seeking capability
 * Displays current playback progress and allows user to seek
 */
interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
}

function ProgressBar({ currentTime, duration, onSeek, className }: ProgressBarProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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
   * Handle click on progress bar to seek
   */
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  return (
    <div className={cn("space-y-1", className)}>
      {/* Time display */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      
      {/* Progress bar */}
      <div 
        className="relative h-2 bg-muted rounded-full cursor-pointer group"
        onClick={handleProgressClick}
      >
        <div 
          className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
        {/* Hover indicator */}
        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
             style={{ left: `${progress}%`, marginLeft: '-6px' }} />
      </div>
    </div>
  );
}

/**
 * Volume control component
 * Includes mute button and volume slider
 */
interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (volume: number) => void;
  onToggleMute: () => void;
  className?: string;
}

function VolumeControl({ volume, isMuted, onVolumeChange, onToggleMute, className }: VolumeControlProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleMute}
        className="p-2"
        aria-label={isMuted ? "Включить звук" : "Выключить звук"}
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      
      {/* Volume slider - hidden on mobile to save space */}
      <div className="hidden sm:block w-20">
        <Slider
          value={[isMuted ? 0 : volume * 100]}
          onValueChange={([value]) => onVolumeChange(value / 100)}
          max={100}
          step={1}
          className="h-2"
        />
      </div>
    </div>
  );
}

/**
 * Track information display
 * Shows current track title, artwork, and metadata
 */
interface TrackInfoProps {
  track: any; // TODO: Use proper Track type
  className?: string;
}

function TrackInfo({ track, className }: TrackInfoProps) {
  if (!track) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
          <Music className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted-foreground">Ничего не играет</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Track artwork */}
      <div className="relative w-12 h-12 flex-shrink-0">
        {track.artwork_url ? (
          <img 
            src={track.artwork_url} 
            alt={track.title}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 rounded flex items-center justify-center">
            <Music className="h-6 w-6 text-primary" />
          </div>
        )}
      </div>
      
      {/* Track details */}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm truncate" title={track.title}>
          {track.title}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs">
            {track.provider}
          </Badge>
          {track.genre && <span>{track.genre}</span>}
        </div>
      </div>
    </div>
  );
}

/**
 * Main playback controls
 * Previous, play/pause, next buttons with loading states
 */
interface PlaybackControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onTogglePlayPause: () => void;
  onNext: () => void;
  className?: string;
}

function PlaybackControls({ 
  isPlaying, 
  isLoading, 
  canGoPrevious, 
  canGoNext, 
  onPrevious, 
  onTogglePlayPause, 
  onNext,
  className 
}: PlaybackControlsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="p-2"
        aria-label="Предыдущий трек"
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      
      <Button
        variant="default"
        size="sm"
        onClick={onTogglePlayPause}
        disabled={isLoading}
        className="p-3"
        aria-label={isPlaying ? "Пауза" : "Воспроизведение"}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5" />
        )}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onNext}
        disabled={!canGoNext}
        className="p-2"
        aria-label="Следующий трек"
      >
        <SkipForward className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Additional controls for shuffle and repeat
 */
interface AdditionalControlsProps {
  shuffleEnabled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  className?: string;
}

function AdditionalControls({ 
  shuffleEnabled, 
  repeatMode, 
  onToggleShuffle, 
  onToggleRepeat,
  className 
}: AdditionalControlsProps) {
  // Get repeat icon based on mode
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;
  
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleShuffle}
        className={cn("p-2", shuffleEnabled && "text-primary")}
        aria-label={shuffleEnabled ? "Выключить перемешивание" : "Включить перемешивание"}
      >
        <Shuffle className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleRepeat}
        className={cn("p-2", repeatMode !== 'none' && "text-primary")}
        aria-label="Режим повтора"
        title={
          repeatMode === 'none' ? 'Без повтора' :
          repeatMode === 'one' ? 'Повтор трека' :
          'Повтор плейлиста'
        }
      >
        <RepeatIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}

/**
 * Main GlobalAudioPlayer component
 * 
 * Renders the complete audio player UI with all controls
 * Automatically shows/hides based on whether there's a current track
 */
export default function GlobalAudioPlayer() {
  const [playerState, playerActions] = useAudioPlayer();
  
  // Don't render if no current track
  if (!playerState.currentTrack) {
    return null;
  }

  // Determine control availability
  const canGoPrevious = playerState.currentIndex > 0 || playerState.repeatMode === 'all';
  const canGoNext = playerState.currentIndex < playerState.playlist.length - 1 || 
                    playerState.repeatMode === 'all' || 
                    playerState.repeatMode === 'one';

  /**
   * Handle repeat mode cycling
   * Cycles through: none -> all -> one -> none
   */
  const handleToggleRepeat = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(playerState.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    playerActions.setRepeatMode(nextMode);
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed player */}
      <div className="h-20" />
      
      {/* Fixed audio player */}
      <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="p-4">
          {/* Mobile layout */}
          <div className="block lg:hidden space-y-3">
            {/* Track info and main controls */}
            <div className="flex items-center justify-between">
              <TrackInfo track={playerState.currentTrack} className="flex-1 min-w-0" />
              <PlaybackControls
                isPlaying={playerState.isPlaying}
                isLoading={playerState.isLoading}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                onPrevious={playerActions.previousTrack}
                onTogglePlayPause={playerActions.togglePlayPause}
                onNext={playerActions.nextTrack}
              />
            </div>
            
            {/* Progress bar */}
            <ProgressBar
              currentTime={playerState.currentTime}
              duration={playerState.duration}
              onSeek={playerActions.seekTo}
            />
            
            {/* Additional controls and volume */}
            <div className="flex items-center justify-between">
              <AdditionalControls
                shuffleEnabled={playerState.shuffleEnabled}
                repeatMode={playerState.repeatMode}
                onToggleShuffle={playerActions.toggleShuffle}
                onToggleRepeat={handleToggleRepeat}
              />
              <VolumeControl
                volume={playerState.volume}
                isMuted={playerState.isMuted}
                onVolumeChange={playerActions.setVolume}
                onToggleMute={playerActions.toggleMute}
              />
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden lg:flex items-center gap-6">
            {/* Track info */}
            <TrackInfo track={playerState.currentTrack} className="w-80 flex-shrink-0" />
            
            {/* Center controls */}
            <div className="flex-1 space-y-2">
              <div className="flex justify-center">
                <PlaybackControls
                  isPlaying={playerState.isPlaying}
                  isLoading={playerState.isLoading}
                  canGoPrevious={canGoPrevious}
                  canGoNext={canGoNext}
                  onPrevious={playerActions.previousTrack}
                  onTogglePlayPause={playerActions.togglePlayPause}
                  onNext={playerActions.nextTrack}
                />
              </div>
              <ProgressBar
                currentTime={playerState.currentTime}
                duration={playerState.duration}
                onSeek={playerActions.seekTo}
              />
            </div>
            
            {/* Right controls */}
            <div className="flex items-center gap-4 w-48 flex-shrink-0 justify-end">
              <AdditionalControls
                shuffleEnabled={playerState.shuffleEnabled}
                repeatMode={playerState.repeatMode}
                onToggleShuffle={playerActions.toggleShuffle}
                onToggleRepeat={handleToggleRepeat}
              />
              <VolumeControl
                volume={playerState.volume}
                isMuted={playerState.isMuted}
                onVolumeChange={playerActions.setVolume}
                onToggleMute={playerActions.toggleMute}
              />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

// TODO: Add playlist management UI
// TODO: Add lyrics display capability
// TODO: Add visualization/equalizer
// TODO: Add casting support (Chromecast, AirPlay)
// TODO: Add offline playback capability
// FIXME: Progress bar seeking on mobile could be more precise
// HACK: Using backdrop-blur fallback for older browsers