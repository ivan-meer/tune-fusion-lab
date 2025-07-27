import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Download, Filter, Activity, Database, Settings } from 'lucide-react';
interface GenerationJob {
  id: string;
  status: string;
  provider: string;
  model: string | null;
  progress: number;
  error_message: string | null;
  request_params: any;
  response_data: any;
  created_at: string;
  updated_at: string;
  credits_used: number;
  track_id: string | null;
  user_id: string;
}
interface ApiHealthLog {
  id: string;
  provider: string;
  model: string | null;
  status: string;
  response_time: number | null;
  error_message: string | null;
  checked_at: string;
}
interface EdgeFunctionLog {
  timestamp: number;
  level: string;
  event_message: string;
  function_id: string;
  event_type: string;
}
export default function AdminPanel() {
  const [generationJobs, setGenerationJobs] = useState<GenerationJob[]>([]);
  const [healthLogs, setHealthLogs] = useState<ApiHealthLog[]>([]);
  const [edgeLogs, setEdgeLogs] = useState<EdgeFunctionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('24h');
  const {
    toast
  } = useToast();
  const loadGenerationJobs = async () => {
    setLoading(true);
    try {
      let query = supabase.from('generation_jobs').select('*').order('created_at', {
        ascending: false
      }).limit(100);
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (providerFilter !== 'all') {
        query = query.eq('provider', providerFilter);
      }

      // Time filter
      if (timeFilter !== 'all') {
        const hoursAgo = timeFilter === '24h' ? 24 : timeFilter === '7d' ? 168 : 1;
        const timeAgo = new Date();
        timeAgo.setHours(timeAgo.getHours() - hoursAgo);
        query = query.gte('created_at', timeAgo.toISOString());
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      setGenerationJobs(data || []);
    } catch (error) {
      console.error('Error loading generation jobs:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить задания генерации",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const loadHealthLogs = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('api_health_logs').select('*').order('checked_at', {
        ascending: false
      }).limit(50);
      if (error) throw error;
      setHealthLogs(data || []);
    } catch (error) {
      console.error('Error loading health logs:', error);
    }
  };
  const loadEdgeFunctionLogs = async () => {
    try {
      // Note: This would need to be implemented via an edge function
      // that queries Supabase analytics logs
      const response = await fetch('/api/edge-function-logs');
      if (response.ok) {
        const data = await response.json();
        setEdgeLogs(data);
      }
    } catch (error) {
      console.error('Error loading edge function logs:', error);
    }
  };
  const checkApiHealth = async () => {
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('check-api-health');
      if (error) throw error;
      toast({
        title: "Проверка завершена",
        description: "Статус API обновлен"
      });
      await loadHealthLogs();
    } catch (error) {
      console.error('Error checking API health:', error);
      toast({
        title: "Ошибка проверки",
        description: "Не удалось проверить статус API",
        variant: "destructive"
      });
    }
  };
  const exportLogs = () => {
    const data = {
      generationJobs,
      healthLogs,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `music-ai-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'healthy':
        return 'bg-green-500';
      case 'failed':
      case 'down':
        return 'bg-red-500';
      case 'processing':
        return 'bg-blue-500';
      case 'degraded':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };
  useEffect(() => {
    loadGenerationJobs();
    loadHealthLogs();
    loadEdgeFunctionLogs();
  }, [statusFilter, providerFilter, timeFilter]);
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Панель администратора
              </CardTitle>
              <CardDescription>
                Мониторинг генерации музыки и состояния API
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={checkApiHealth} disabled={loading}>
                <Activity className="h-4 w-4 mr-1" />
                Проверить API
              </Button>
              <Button variant="outline" size="sm" onClick={exportLogs}>
                <Download className="h-4 w-4 mr-1" />
                Экспорт
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
              loadGenerationJobs();
              loadHealthLogs();
              loadEdgeFunctionLogs();
            }} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="jobs" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Задания генерации
              </TabsTrigger>
              <TabsTrigger value="health" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Здоровье API
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Логи функций
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jobs" className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label>Статус:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      <SelectItem value="pending">Ожидание</SelectItem>
                      <SelectItem value="processing">Обработка</SelectItem>
                      <SelectItem value="completed">Завершено</SelectItem>
                      <SelectItem value="failed">Ошибка</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label>Провайдер:</Label>
                  <Select value={providerFilter} onValueChange={setProviderFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      <SelectItem value="suno">Suno</SelectItem>
                      <SelectItem value="mureka">Mureka</SelectItem>
                      <SelectItem value="test">Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label>Период:</Label>
                  <Select value={timeFilter} onValueChange={setTimeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Последний час</SelectItem>
                      <SelectItem value="24h">24 часа</SelectItem>
                      <SelectItem value="7d">7 дней</SelectItem>
                      <SelectItem value="all">Все время</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {generationJobs.map(job => <Card key={job.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                            <Badge variant="outline">
                              {job.provider}
                            </Badge>
                            {job.model && <Badge variant="secondary">
                                {job.model}
                              </Badge>}
                          </div>
                          
                          <div className="text-sm text-muted-foreground">
                            ID: {job.id}
                          </div>
                          
                          <div className="text-sm">
                            <strong>Прогресс:</strong> {job.progress}%
                          </div>
                          
                          {job.error_message && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              <strong>Ошибка:</strong> {job.error_message}
                            </div>}

                          <div className="text-sm">
                            <strong>Создано:</strong> {new Date(job.created_at).toLocaleString('ru-RU')}
                          </div>

                          {job.request_params && <details className="text-sm">
                              <summary className="cursor-pointer font-medium">Параметры запроса</summary>
                              <pre className="mt-2 p-2 rounded text-xs overflow-x-auto bg-zinc-900">
                                {JSON.stringify(job.request_params, null, 2)}
                              </pre>
                            </details>}

                          {job.response_data && <details className="text-sm">
                              <summary className="cursor-pointer font-medium">Ответ API</summary>
                              <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(job.response_data, null, 2)}
                              </pre>
                            </details>}
                        </div>
                      </div>
                    </Card>)}
                  
                  {generationJobs.length === 0 && !loading && <div className="text-center py-8 text-muted-foreground">
                      Нет заданий генерации
                    </div>}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {healthLogs.map(log => <Card key={log.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <Badge className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                            <Badge variant="outline">
                              {log.provider}
                            </Badge>
                            {log.model && <Badge variant="secondary">
                                {log.model}
                              </Badge>}
                          </div>
                          
                          {log.response_time && <div className="text-sm">
                              <strong>Время ответа:</strong> {log.response_time}ms
                            </div>}
                          
                          {log.error_message && <div className="text-sm text-red-600">
                              <strong>Ошибка:</strong> {log.error_message}
                            </div>}

                          <div className="text-sm text-muted-foreground">
                            {new Date(log.checked_at).toLocaleString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    </Card>)}
                  
                  {healthLogs.length === 0 && <div className="text-center py-8 text-muted-foreground">
                      Нет логов состояния API
                    </div>}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="logs" className="space-y-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {edgeLogs.map((log, index) => <Card key={index} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.level === 'error' ? 'destructive' : 'secondary'}>
                            {log.level}
                          </Badge>
                          <Badge variant="outline">
                            {log.event_type}
                          </Badge>
                        </div>
                        
                        <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                          {log.event_message}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.timestamp / 1000).toLocaleString('ru-RU')}
                        </div>
                      </div>
                    </Card>)}
                  
                  {edgeLogs.length === 0 && <div className="text-center py-8 text-muted-foreground">
                      Нет логов Edge Functions
                    </div>}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>;
}