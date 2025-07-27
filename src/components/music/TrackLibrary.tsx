/**
 * Optimized Track Library Component
 * 
 * High-performance track library with React Query, virtualization,
 * and proper memoization strategies
 */

import React, { memo, useState, useCallback, useMemo, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Music, 
  Search, 
  Grid, 
  List, 
  Filter,
  SortAsc,
  SortDesc,
  RefreshCw,
  Settings,
  Download,
  Upload
} from 'lucide-react';
import { useOptimizedUserTracks } from '@/hooks/useOptimizedUserTracks';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Track } from '@/hooks/useUserTracks';

// Lazy load heavy components
const VirtualizedTrackList = React.lazy(() => import('./library/VirtualizedTrackList'));
const TrackCard = React.lazy(() => import('./library/TrackCard'));

// Search and filter options
const SORT_OPTIONS = [
  { value: 'created_at', label: 'Дата создания' },
  { value: 'title', label: 'Название' },
  { value: 'play_count', label: 'Прослушивания' },
  { value: 'like_count', label: 'Лайки' },
  { value: 'duration', label: 'Длительность' }
] as const;

const GENRE_OPTIONS = [
  'pop', 'rock', 'electronic', 'jazz', 'classical', 'hip-hop', 'country', 'folk', 'ambient'
] as const;

// Loading skeleton component
const TrackListSkeleton = memo(() => (
  <div className="space-y-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
        <Skeleton className="w-12 h-12 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </div>
    ))}
  </div>
));

TrackListSkeleton.displayName = 'TrackListSkeleton';

// Filter bar component
const FilterBar = memo<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedGenre: string | null;
  onGenreChange: (genre: string | null) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}>(({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  sortBy,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  isRefreshing
}) => {
  return (
    <div className="space-y-4">
      {/* Search and actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Поиск треков..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Обновить
        </Button>
        
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="rounded-r-none"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="rounded-l-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Filters and sorting */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">Жанр:</span>
          <select
            value={selectedGenre || ''}
            onChange={(e) => onGenreChange(e.target.value || null)}
            className="bg-background border rounded px-2 py-1"
          >
            <option value="">Все жанры</option>
            {GENRE_OPTIONS.map(genre => (
              <option key={genre} value={genre}>
                {genre.charAt(0).toUpperCase() + genre.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Сортировка:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-background border rounded px-2 py-1"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
});

FilterBar.displayName = 'FilterBar';

// Main library component
const TrackLibrary = memo(() => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const { toast } = useToast();
  const [playerState, playerActions] = useAudioPlayer();

  // Use optimized tracks hook
  const {
    tracks,
    isLoading,
    error,
    isRefetching,
    deleteTrack,
    updateTrack,
    likeTrack,
    reloadTracks,
    isDeletingTrack,
    isLikingTrack
  } = useOptimizedUserTracks();

  // Memoized filtered and sorted tracks
  const filteredAndSortedTracks = useMemo(() => {
    let filtered = tracks;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(track =>
        track.title.toLowerCase().includes(query) ||
        track.description?.toLowerCase().includes(query) ||
        track.genre?.toLowerCase().includes(query) ||
        track.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply genre filter
    if (selectedGenre) {
      filtered = filtered.filter(track => 
        track.genre?.toLowerCase() === selectedGenre.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Track];
      let bValue: any = b[sortBy as keyof Track];

      // Handle different data types
      if (sortBy === 'created_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || '';
      } else if (typeof aValue === 'number') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [tracks, searchQuery, selectedGenre, sortBy, sortOrder]);

  // Callback handlers with useCallback for performance
  const handleTrackPlay = useCallback((track: Track) => {
    if (playerState.currentTrack?.id === track.id) {
      playerActions.togglePlayPause();
    } else {
      playerActions.playTrack(track, filteredAndSortedTracks);
    }
  }, [playerState.currentTrack, playerActions, filteredAndSortedTracks]);

  const handleTrackLike = useCallback((trackId: string) => {
    likeTrack(trackId);
  }, [likeTrack]);

  const handleTrackDelete = useCallback((trackId: string) => {
    deleteTrack(trackId);
  }, [deleteTrack]);

  const handleTrackDownload = useCallback((track: Track) => {
    if (track.file_url) {
      const link = document.createElement('a');
      link.href = track.file_url;
      link.download = `${track.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Загрузка начата",
        description: `Скачивание "${track.title}"`,
      });
    }
  }, [toast]);

  // Error state
  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-destructive mb-4">
            <Music className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-lg font-semibold">Ошибка загрузки треков</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button onClick={reloadTracks} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Попробовать снова
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Моя библиотека</h2>
          <p className="text-muted-foreground">
            {isLoading ? 'Загрузка...' : `${filteredAndSortedTracks.length} из ${tracks.length} треков`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Music className="w-3 h-3" />
            {tracks.length} треков
          </Badge>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={reloadTracks}
        isRefreshing={isRefetching}
      />

      {/* Track List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <TrackListSkeleton />
            </div>
          ) : filteredAndSortedTracks.length === 0 ? (
            <div className="p-8 text-center">
              <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || selectedGenre ? 'Треки не найдены' : 'Библиотека пуста'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedGenre 
                  ? 'Попробуйте изменить критерии поиска'
                  : 'Создайте свой первый трек, чтобы он появился здесь'
                }
              </p>
              {(searchQuery || selectedGenre) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre(null);
                  }}
                >
                  Сбросить фильтры
                </Button>
              )}
            </div>
          ) : (
            <Suspense fallback={<TrackListSkeleton />}>
              <VirtualizedTrackList
                tracks={filteredAndSortedTracks}
                viewMode={viewMode}
                currentPlayingId={playerState.currentTrack?.id}
                isPlaying={playerState.isPlaying}
                onTrackLike={handleTrackLike}
                onTrackDelete={handleTrackDelete}
                onTrackPlay={handleTrackPlay}
                isLikingTrack={isLikingTrack}
                isDeletingTrack={isDeletingTrack}
                height={600}
              />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

TrackLibrary.displayName = 'TrackLibrary';

export default TrackLibrary;