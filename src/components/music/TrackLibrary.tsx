/**
 * TrackLibrary Component - Refactored Version
 * 
 * Enhanced music library with global audio player integration
 * Features comprehensive track management with modern UX/UI
 * 
 * Features:
 * - Integrated global audio player
 * - Responsive grid/list views
 * - Advanced filtering and search
 * - Real-time updates via Supabase
 * - Batch operations support
 * - Admin panel for debugging
 * 
 * @author AI Music Generator Team
 * @version 2.0.0 - Refactored with global player integration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUserTracks, Track } from '@/hooks/useUserTracks';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import AdminPanel from '@/components/ui/admin-panel';
import TrackCard from '@/components/music/library/TrackCard';
import { 
  Music, 
  Search,
  Filter,
  Grid,
  List,
  Sparkles,
  Settings,
  Play,
  RefreshCw
} from 'lucide-react';

/**
 * Main TrackLibrary component - now streamlined with new TrackCard
 * Focuses on state management and layout while delegating display to TrackCard
 */

export default function TrackLibrary() {
  // State management for UI controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Data management hooks
  const { tracks, isLoading, error, loadTracks, deleteTrack, likeTrack, syncTrackStorage } = useUserTracks();
  const [playerState, playerActions] = useAudioPlayer();
  const { toast } = useToast();
  
  // Real-time updates for tracks
  useRealtimeUpdates({
    onTrackUpdate: () => {
      console.log('Real-time track update detected, refreshing...');
      loadTracks();
      
      toast({
        title: "Новый трек добавлен!",
        description: "Ваша библиотека была обновлена"
      });
    }
  });
  
  // Auto-refresh tracks when component mounts (without auto-sync to prevent loops)
  useEffect(() => {
    loadTracks(false); // FIXED: Explicit false to prevent auto-sync loop
  }, [loadTracks]);

  // Filter tracks based on search and filters
  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = filterProvider === 'all' || track.provider === filterProvider;
    const matchesGenre = filterGenre === 'all' || track.genre === filterGenre;
    
    return matchesSearch && matchesProvider && matchesGenre;
  });

  // Get unique genres for filter dropdown
  const genres = Array.from(new Set(tracks.map(track => track.genre).filter(Boolean)));

  /**
   * Handle track like/unlike action
   * Includes error handling and user feedback
   */
  const handleLike = async (trackId: string) => {
    try {
      await likeTrack(trackId);
      toast({
        title: "Лайк обновлен",
        description: "Статус лайка для трека изменен"
      });
    } catch (error) {
      console.error('Like track error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось поставить лайк",
        variant: "destructive"
      });
    }
  };

  /**
   * Handle track deletion with confirmation
   * TODO: Add confirmation dialog before deletion
   */
  const handleDelete = async (trackId: string, trackTitle: string) => {
    try {
      // Stop playback if this track is currently playing
      if (playerState.currentTrack?.id === trackId) {
        playerActions.stop();
      }
      
      await deleteTrack(trackId);
      toast({
        title: "Трек удален",
        description: `"${trackTitle}" был удален из библиотеки`
      });
    } catch (error) {
      console.error('Delete track error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить трек",
        variant: "destructive"
      });
    }
  };

  /**
   * Handle track download
   * TODO: Implement proper download with progress tracking
   */
  const handleDownload = (track: Track) => {
    if (!track.file_url) {
      toast({
        title: "Ошибка",
        description: "Файл трека недоступен для скачивания",
        variant: "destructive"
      });
      return;
    }

    // Simple download implementation
    const link = document.createElement('a');
    link.href = track.file_url;
    link.download = `${track.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Скачивание началось",
      description: `Трек "${track.title}" загружается`
    });
  };

  /**
   * Handle track sharing
   * TODO: Implement Web Share API with fallbacks
   */
  const handleShare = async (track: Track) => {
    try {
      if (navigator.share && track.file_url) {
        await navigator.share({
          title: track.title,
          text: `Послушайте этот трек: ${track.title}`,
          url: track.file_url
        });
      } else {
        // Fallback to copying link
        await navigator.clipboard.writeText(track.file_url || window.location.href);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на трек скопирована в буфер обмена"
        });
      }
    } catch (error) {
      console.error('Share track error:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось поделиться треком",
        variant: "destructive"
      });
    }
  };

  /**
   * Play all filtered tracks as playlist
   * Sets up global player with current filtered track list
   */
  const playAllTracks = () => {
    if (filteredTracks.length === 0) return;
    
    playerActions.playTrack(filteredTracks[0], filteredTracks);
    toast({
      title: "Плейлист запущен",
      description: `Запущено воспроизведение ${filteredTracks.length} треков`
    });
  };

  if (isLoading) {
  return (
    <div className="space-y-6">
      {showAdmin && <AdminPanel />}
      
      <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Моя библиотека
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Загружаем ваши треки...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Моя библиотека
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <p className="text-destructive">{error}</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Попробовать снова
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showAdmin && <AdminPanel />}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Моя библиотека
              <Badge variant="secondary" className="ml-2">
                {tracks.length} треков
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {/* Play all button */}
              {filteredTracks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={playAllTracks}
                  className="gap-1"
                >
                  <Play className="h-4 w-4" />
                  Играть все ({filteredTracks.length})
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdmin(!showAdmin)}
              >
                <Settings className="h-4 w-4 mr-1" />
                {showAdmin ? 'Скрыть логи' : 'Показать логи'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadTracks(true)}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Обновление...' : 'Обновить'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={syncTrackStorage}
                disabled={isLoading}
                title="Синхронизировать URL треков с хранилищем"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Синхронизация
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск треков..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Select value={filterProvider} onValueChange={setFilterProvider}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Провайдер" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="suno">Suno AI</SelectItem>
                  <SelectItem value="mureka">Mureka AI</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterGenre} onValueChange={setFilterGenre}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Жанр" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все жанры</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre!}>
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tracks Display */}
          {filteredTracks.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="p-4 rounded-full bg-muted w-fit mx-auto">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">
                  {tracks.length === 0 ? 'Пока нет треков' : 'Треки не найдены'}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {tracks.length === 0 
                    ? 'Создайте свой первый трек с помощью ИИ в студии'
                    : 'Попробуйте изменить параметры поиска'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                : 'space-y-3'
            }>
              {filteredTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  viewMode={viewMode}
                  isCurrentlyPlaying={playerState.currentTrack?.id === track.id}
                  isPlaying={playerState.currentTrack?.id === track.id && playerState.isPlaying}
                  onLike={() => handleLike(track.id)}
                  onDelete={() => handleDelete(track.id, track.title)}
                  onDownload={() => handleDownload(track)}
                  onShare={() => handleShare(track)}
                  onPlay={() => {
                    if (playerState.currentTrack?.id === track.id) {
                      playerActions.togglePlayPause();
                    } else {
                      playerActions.playTrack(track, filteredTracks);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}