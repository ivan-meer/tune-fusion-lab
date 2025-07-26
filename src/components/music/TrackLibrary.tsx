import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useUserTracks, Track } from '@/hooks/useUserTracks';
import { useToast } from '@/hooks/use-toast';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import AdminPanel from '@/components/ui/admin-panel';
import { 
  Music, 
  Play, 
  Pause, 
  Download, 
  Share, 
  Trash2, 
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Clock,
  Sparkles,
  Settings
} from 'lucide-react';

interface TrackCardProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onLike: () => void;
  onDelete: () => void;
  viewMode: 'grid' | 'list';
}

function TrackCard({ track, isPlaying, onPlay, onPause, onLike, onDelete, viewMode }: TrackCardProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="relative">
          {track.artwork_url ? (
            <img 
              src={track.artwork_url} 
              alt={track.title}
              className="w-12 h-12 rounded object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
              <Music className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <Button
            size="sm"
            variant="secondary"
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{track.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {track.provider}
            </Badge>
            {track.genre && <span>{track.genre}</span>}
            <span>{formatDuration(track.duration)}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            {track.like_count}
          </div>
          <span>{formatDate(track.created_at)}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onLike}>
            <Heart className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <Share className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className="group hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="aspect-square relative mb-3">
          {track.artwork_url ? (
            <img 
              src={track.artwork_url} 
              alt={track.title}
              className="w-full h-full object-cover rounded"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 rounded flex items-center justify-center">
              <Music className="w-12 h-12 text-primary" />
            </div>
          )}
          
          <Button
            size="sm"
            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={isPlaying ? onPause : onPlay}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium truncate">{track.title}</h3>
          
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
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Heart className="w-3 h-3" />
              {track.like_count}
            </div>
            
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={onLike}>
                <Heart className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost">
                <Download className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="ghost" onClick={onDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TrackLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  
  const { tracks, isLoading, error, loadTracks, deleteTrack, likeTrack } = useUserTracks();
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
  
  // Auto-refresh tracks when component mounts
  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  // Filter tracks based on search and filters
  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = filterProvider === 'all' || track.provider === filterProvider;
    const matchesGenre = filterGenre === 'all' || track.genre === filterGenre;
    
    return matchesSearch && matchesProvider && matchesGenre;
  });

  // Get unique genres for filter
  const genres = Array.from(new Set(tracks.map(track => track.genre).filter(Boolean)));

  const handlePlay = (trackId: string) => {
    setCurrentlyPlaying(trackId);
  };

  const handlePause = () => {
    setCurrentlyPlaying(null);
  };

  const handleLike = async (trackId: string) => {
    try {
      await likeTrack(trackId);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось поставить лайк",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (trackId: string, trackTitle: string) => {
    try {
      await deleteTrack(trackId);
      toast({
        title: "Трек удален",
        description: `"${trackTitle}" был удален из библиотеки`
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить трек",
        variant: "destructive"
      });
    }
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
                onClick={loadTracks}
                disabled={isLoading}
              >
                {isLoading ? 'Обновление...' : 'Обновить'}
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
                  isPlaying={currentlyPlaying === track.id}
                  onPlay={() => handlePlay(track.id)}
                  onPause={handlePause}
                  onLike={() => handleLike(track.id)}
                  onDelete={() => handleDelete(track.id, track.title)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}