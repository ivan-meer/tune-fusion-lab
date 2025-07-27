/**
 * Upload Analytics Component
 * 
 * Компонент для отображения аналитики загрузки треков:
 * - Статистика по загруженным файлам
 * - Использование хранилища
 * - Метрики производительности
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Database, 
  HardDrive, 
  Activity, 
  FileAudio,
  Clock,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useUserTracks } from '@/hooks/useUserTracks';
import { useTrackStorage } from '@/hooks/useTrackStorage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StorageStats {
  totalFiles: number;
  totalSize: number;
  averageSize: number;
  formats: Record<string, number>;
  uploadTrends: { date: string; count: number }[];
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  return `${minutes}м`;
};

export default function UploadAnalytics() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  
  const { tracks } = useUserTracks();
  const { listBucketFiles, isLoading: isStorageLoading } = useTrackStorage();
  const { toast } = useToast();

  // Calculate analytics from tracks
  const analytics = useMemo(() => {
    const totalTracks = tracks.length;
    const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
    // Note: file_size is not available in Track interface, calculate from uploaded files
    const totalSize = 0; // Will be calculated from storage stats
    
    const genreDistribution = tracks.reduce((acc, track) => {
      const genre = track.genre || 'unknown';
      acc[genre] = (acc[genre] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const providerDistribution = tracks.reduce((acc, track) => {
      acc[track.provider] = (acc[track.provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const publicTracksCount = tracks.filter(track => track.is_public).length;
    const averageDuration = totalTracks > 0 ? totalDuration / totalTracks : 0;

    return {
      totalTracks,
      totalDuration,
      totalSize,
      averageDuration,
      genreDistribution,
      providerDistribution,
      publicTracksCount,
      privateTracksCount: totalTracks - publicTracksCount
    };
  }, [tracks]);

  // Load storage analytics
  const loadStorageStats = async () => {
    try {
      setIsLoading(true);
      
      // Get storage files
      const storageFiles = await listBucketFiles();
      
      // Get recent uploads (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentTracks } = await supabase
        .from('tracks')
        .select('created_at, audio_format')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Calculate upload trends
      const uploadTrends = (recentTracks || []).reduce((acc, track) => {
        const date = new Date(track.created_at).toDateString();
        const existing = acc.find(item => item.date === date);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ date, count: 1 });
        }
        return acc;
      }, [] as { date: string; count: number }[]);

      // Calculate file format distribution
      const formats = storageFiles.reduce((acc, file) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
        acc[ext] = (acc[ext] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalSize = storageFiles.reduce((sum, file) => {
        return sum + (file.metadata?.size || 0);
      }, 0);

      setStats({
        totalFiles: storageFiles.length,
        totalSize,
        averageSize: storageFiles.length > 0 ? totalSize / storageFiles.length : 0,
        formats,
        uploadTrends
      });

      setLastSyncTime(new Date().toLocaleTimeString());
      
    } catch (error) {
      console.error('Error loading storage stats:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить статистику хранилища",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStorageStats();
  }, []);

  const handleRefresh = () => {
    loadStorageStats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Аналитика загрузок</h2>
          <p className="text-muted-foreground">
            Статистика и метрики вашей библиотеки треков
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isLoading || isStorageLoading}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего треков</CardTitle>
            <FileAudio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTracks}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.publicTracksCount} публичных
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общий размер</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(stats?.totalSize || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {stats ? `${stats.totalFiles} файлов в хранилище` : 'Загрузка...'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая длительность</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(analytics.totalDuration)}</div>
            <p className="text-xs text-muted-foreground">
              В среднем {formatDuration(analytics.averageDuration)} на трек
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Активность</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.uploadTrends.reduce((sum, day) => sum + day.count, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Загрузок за последние 30 дней
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Распределение по провайдерам
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.providerDistribution).map(([provider, count]) => {
              const percentage = (count / analytics.totalTracks) * 100;
              return (
                <div key={provider} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="capitalize">{provider}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Genre Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Распределение по жанрам
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.genreDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([genre, count]) => {
                const percentage = (count / analytics.totalTracks) * 100;
                return (
                  <div key={genre} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="capitalize">{genre}</span>
                      <span className="text-sm text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* File Formats */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Форматы файлов
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.formats).map(([format, count]) => (
                  <Badge key={format} variant="secondary">
                    .{format} ({count})
                  </Badge>
                ))}
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Средний размер файла: {formatFileSize(stats.averageSize)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Storage Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Статус хранилища
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Синхронизация</span>
              <Badge variant="outline" className="text-green-600">
                Активна
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Последняя проверка</span>
              <span className="text-sm text-muted-foreground">
                {lastSyncTime || 'Никогда'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Файлов в хранилище</span>
              <span className="font-medium">{stats?.totalFiles || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Записей в БД</span>
              <span className="font-medium">{analytics.totalTracks}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}