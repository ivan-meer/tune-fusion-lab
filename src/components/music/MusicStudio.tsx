import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { Wand2, Sparkles, Music } from 'lucide-react';

interface GenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  prompt: string;
  provider: 'mureka' | 'suno';
}

export default function MusicStudio() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'mureka' | 'suno'>('suno');
  const [style, setStyle] = useState('pop');
  const [duration, setDuration] = useState('60');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите описание для генерации музыки",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в аккаунт для генерации музыки",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate generation process
    const job: GenerationJob = {
      id: Date.now().toString(),
      status: 'processing',
      progress: 0,
      prompt,
      provider
    };
    
    setCurrentJob(job);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setCurrentJob(prev => {
        if (!prev) return null;
        const newProgress = Math.min(prev.progress + Math.random() * 20, 100);
        
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setIsGenerating(false);
          toast({
            title: "Генерация завершена!",
            description: "Ваш трек готов"
          });
          return { ...prev, status: 'completed', progress: 100 };
        }
        
        return { ...prev, progress: newProgress };
      });
    }, 1000);

    setTimeout(() => {
      if (progressInterval) clearInterval(progressInterval);
      setIsGenerating(false);
    }, 10000);
  };

  const resetGeneration = () => {
    setCurrentJob(null);
    setPrompt('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Генерация музыки с ИИ
          </CardTitle>
          <CardDescription>
            Создайте уникальную музыку, описав то, что хотите услышать
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!currentJob ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="prompt">Описание трека</Label>
                <Textarea
                  id="prompt"
                  placeholder="Например: Энергичная поп-песня о лете с яркими синтезаторами и женским вокалом"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>ИИ Провайдер</Label>
                  <Select value={provider} onValueChange={(value: 'mureka' | 'suno') => setProvider(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suno">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Suno AI
                        </div>
                      </SelectItem>
                      <SelectItem value="mureka">
                        <div className="flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          Mureka AI
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Стиль</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pop">Поп</SelectItem>
                      <SelectItem value="rock">Рок</SelectItem>
                      <SelectItem value="electronic">Электронная</SelectItem>
                      <SelectItem value="hip-hop">Хип-хоп</SelectItem>
                      <SelectItem value="classical">Классическая</SelectItem>
                      <SelectItem value="ambient">Эмбиент</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Длительность</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 сек</SelectItem>
                      <SelectItem value="60">1 мин</SelectItem>
                      <SelectItem value="120">2 мин</SelectItem>
                      <SelectItem value="180">3 мин</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Создать музыку
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Генерация в процессе</h3>
                <Badge variant={currentJob.status === 'completed' ? 'default' : 'secondary'}>
                  {currentJob.status === 'processing' ? 'Обработка' : 'Завершено'}
                </Badge>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Промпт:</p>
                <p className="text-sm">{currentJob.prompt}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Прогресс</span>
                  <span>{Math.round(currentJob.progress)}%</span>
                </div>
                <Progress value={currentJob.progress} className="h-2" />
              </div>

              {currentJob.status === 'completed' && (
                <div className="space-y-3">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary">Трек готов!</p>
                    <p className="text-xs text-muted-foreground">Музыка добавлена в вашу библиотеку</p>
                  </div>
                  
                  <Button onClick={resetGeneration} variant="outline" className="w-full">
                    Создать новый трек
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}