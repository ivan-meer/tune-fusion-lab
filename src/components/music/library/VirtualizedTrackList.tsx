/**
 * Virtualized Track List Component
 * 
 * High-performance virtualized list for handling large numbers of tracks
 * Uses react-window for efficient rendering of only visible items
 */

import React, { memo, useMemo, useCallback, forwardRef } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Track } from '@/hooks/useUserTracks';
import TrackCard from './TrackCard';
import { cn } from '@/lib/utils';

interface VirtualizedTrackListProps {
  tracks: Track[];
  viewMode: 'grid' | 'list';
  currentPlayingId?: string;
  isPlaying?: boolean;
  onTrackLike: (trackId: string) => void;
  onTrackDelete: (trackId: string) => void;
  onTrackPlay?: (track: Track) => void;
  isLikingTrack?: boolean;
  isDeletingTrack?: boolean;
  className?: string;
  height?: number;
  width?: string | number;
}

// Item data for react-window
interface ItemData {
  tracks: Track[];
  viewMode: 'grid' | 'list';
  currentPlayingId?: string;
  isPlaying?: boolean;
  onTrackLike: (trackId: string) => void;
  onTrackDelete: (trackId: string) => void;
  onTrackPlay?: (track: Track) => void;
  isLikingTrack?: boolean;
  isDeletingTrack?: boolean;
}

// Individual list item component
const ListItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: ItemData;
}>(({ index, style, data }) => {
  const {
    tracks,
    viewMode,
    currentPlayingId,
    isPlaying,
    onTrackLike,
    onTrackDelete,
    onTrackPlay,
    isLikingTrack,
    isDeletingTrack
  } = data;

  const track = tracks[index];

  if (!track) return null;

  const handleLike = useCallback(() => {
    onTrackLike(track.id);
  }, [onTrackLike, track.id]);

  const handleDelete = useCallback(() => {
    onTrackDelete(track.id);
  }, [onTrackDelete, track.id]);

  const handlePlay = useCallback(() => {
    onTrackPlay?.(track);
  }, [onTrackPlay, track]);

  return (
    <div style={style} className="px-2">
      <TrackCard
        track={track}
        viewMode={viewMode}
        isCurrentlyPlaying={currentPlayingId === track.id}
        isPlaying={isPlaying && currentPlayingId === track.id}
        onLike={handleLike}
        onDelete={handleDelete}
        onPlay={handlePlay}
        isLiking={isLikingTrack}
        isDeleting={isDeletingTrack}
        className="mb-2"
      />
    </div>
  );
});

ListItem.displayName = 'ListItem';

// Grid item component for grid view
const GridItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: ItemData & { itemsPerRow: number };
}>(({ index, style, data }) => {
  const {
    tracks,
    viewMode,
    currentPlayingId,
    isPlaying,
    onTrackLike,
    onTrackDelete,
    onTrackPlay,
    isLikingTrack,
    isDeletingTrack,
    itemsPerRow
  } = data;

  // Calculate which tracks to render in this row
  const startIndex = index * itemsPerRow;
  const endIndex = Math.min(startIndex + itemsPerRow, tracks.length);
  const rowTracks = tracks.slice(startIndex, endIndex);

  return (
    <div style={style} className="flex gap-4 px-2">
      {rowTracks.map((track) => {
        const handleLike = () => onTrackLike(track.id);
        const handleDelete = () => onTrackDelete(track.id);
        const handlePlay = () => onTrackPlay?.(track);

        return (
          <div key={track.id} className="flex-1 min-w-0">
            <TrackCard
              track={track}
              viewMode={viewMode}
              isCurrentlyPlaying={currentPlayingId === track.id}
              isPlaying={isPlaying && currentPlayingId === track.id}
              onLike={handleLike}
              onDelete={handleDelete}
              onPlay={handlePlay}
              isLiking={isLikingTrack}
              isDeleting={isDeletingTrack}
            />
          </div>
        );
      })}
      {/* Fill empty slots in the last row */}
      {Array.from({ length: itemsPerRow - rowTracks.length }).map((_, i) => (
        <div key={`empty-${i}`} className="flex-1 min-w-0" />
      ))}
    </div>
  );
});

GridItem.displayName = 'GridItem';

// Custom scrollbar styles
const customScrollbarProps = {
  className: cn(
    "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border",
    "hover:scrollbar-thumb-border/80"
  )
};

const VirtualizedTrackList = memo<VirtualizedTrackListProps>(({
  tracks,
  viewMode,
  currentPlayingId,
  isPlaying,
  onTrackLike,
  onTrackDelete,
  onTrackPlay,
  isLikingTrack,
  isDeletingTrack,
  className,
  height = 600,
  width = '100%'
}) => {
  // Calculate item height and count based on view mode
  const { itemHeight, itemCount, itemsPerRow } = useMemo(() => {
    if (viewMode === 'list') {
      return {
        itemHeight: 80, // Height of each list item
        itemCount: tracks.length,
        itemsPerRow: 1
      };
    } else {
      // Grid mode - calculate items per row based on container width
      // Assuming 300px per card + 16px gap
      const estimatedItemsPerRow = Math.max(1, Math.floor((typeof width === 'number' ? width : 1200) / 316));
      return {
        itemHeight: 320, // Height of each grid row
        itemCount: Math.ceil(tracks.length / estimatedItemsPerRow),
        itemsPerRow: estimatedItemsPerRow
      };
    }
  }, [viewMode, tracks.length, width]);

  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    tracks,
    viewMode,
    currentPlayingId,
    isPlaying,
    onTrackLike,
    onTrackDelete,
    onTrackPlay,
    isLikingTrack,
    isDeletingTrack,
    ...(viewMode === 'grid' && { itemsPerRow })
  }), [
    tracks,
    viewMode,
    currentPlayingId,
    isPlaying,
    onTrackLike,
    onTrackDelete,
    onTrackPlay,
    isLikingTrack,
    isDeletingTrack,
    itemsPerRow
  ]);

  // Custom outer element with scrollbar styles
  const outerElementType = useMemo(
    () => forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>((props, ref) => (
      <div
        ref={ref}
        {...props}
        {...customScrollbarProps}
        className={cn(props.className, customScrollbarProps.className)}
      />
    )),
    []
  );

  if (tracks.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64", className)}>
        <div className="text-center text-muted-foreground">
          <p>Нет треков для отображения</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <List
        height={height}
        width={width}
        itemCount={itemCount}
        itemSize={itemHeight}
        itemData={itemData}
        outerElementType={outerElementType}
        overscanCount={5} // Render 5 extra items outside visible area
      >
        {viewMode === 'list' ? ListItem : GridItem}
      </List>
    </div>
  );
});

VirtualizedTrackList.displayName = 'VirtualizedTrackList';

export default VirtualizedTrackList;