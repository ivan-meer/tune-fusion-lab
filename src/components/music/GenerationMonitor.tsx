import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';

interface GenerationJob {
  id: string;
  status: string;
  progress: number;
  provider: string;
  model: string;
  created_at: string;
  updated_at: string;
  error_message?: string;
  user_id: string;
}

interface MonitorStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  stuck: number;
}

export default function GenerationMonitor() {
  const [jobs, setJobs] = useState<GenerationJob[]>([]);
  const [stats, setStats] = useState<MonitorStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    stuck: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recent generation jobs
      const { data: jobsData, error } = await supabase
        .from('generation_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setJobs(jobsData || []);

      // Calculate stats
      const now = new Date();
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
      
      const newStats = {
        total: jobsData?.length || 0,
        pending: jobsData?.filter(job => job.status === 'pending').length || 0,
        processing: jobsData?.filter(job => job.status === 'processing').length || 0,
        completed: jobsData?.filter(job => job.status === 'completed').length || 0,
        failed: jobsData?.filter(job => job.status === 'failed').length || 0,
        stuck: jobsData?.filter(job => 
          (job.status === 'processing' || job.status === 'pending') && 
          new Date(job.updated_at) < fifteenMinutesAgo
        ).length || 0
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить данные мониторинга",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupStuckTasks = async () => {
    try {
      setIsCleaningUp(true);
      
      const { data, error } = await supabase.functions.invoke('cleanup-stuck-tasks');
      
      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Очистка завершена",
          description: `Очищено ${data.cleanedJobs} застрявших задач`
        });
        await fetchJobs(); // Refresh data
      } else {
        throw new Error(data?.error || 'Cleanup failed');
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Ошибка очистки",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const isStuck = (job: GenerationJob) => {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    return (job.status === 'processing' || job.status === 'pending') && 
           new Date(job.updated_at) < fifteenMinutesAgo;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Всего</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Ожидают</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <div className="text-xs text-muted-foreground">В процессе</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Завершены</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-muted-foreground">Ошибки</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.stuck}</div>
            <div className="text-xs text-muted-foreground">Застряли</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={fetchJobs}
          disabled={isLoading}
          variant="outline"
          className="flex-1 sm:flex-none"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
        
        <Button
          onClick={cleanupStuckTasks}
          disabled={isCleaningUp || stats.stuck === 0}
          variant="destructive"
          className="flex-1 sm:flex-none"
        >
          <AlertTriangle className={`h-4 w-4 mr-2 ${isCleaningUp ? 'animate-pulse' : ''}`} />
          {isCleaningUp ? 'Очистка...' : `Очистить застрявшие (${stats.stuck})`}
        </Button>
      </div>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>Последние задачи генерации</CardTitle>
          <CardDescription>
            Мониторинг активных и недавних задач генерации музыки
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border ${
                  isStuck(job) ? 'border-orange-200 bg-orange-50' : ''
                }`}
              >
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(job.status)}>
                        {job.status}
                      </Badge>
                      <Badge variant="outline">
                        {job.provider}
                      </Badge>
                      {job.model && (
                        <Badge variant="outline" className="text-xs">
                          {job.model}
                        </Badge>
                      )}
                      {isStuck(job) && (
                        <Badge variant="destructive" className="text-xs">
                          STUCK
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(job.created_at).toLocaleString()}
                    </div>
                    {job.error_message && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                        {job.error_message}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="w-full sm:w-32">
                  {job.status === 'processing' && (
                    <div className="space-y-1">
                      <Progress value={job.progress} className="h-2" />
                      <div className="text-xs text-muted-foreground text-center">
                        {job.progress}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {jobs.length === 0 && !isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Нет данных для отображения
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}