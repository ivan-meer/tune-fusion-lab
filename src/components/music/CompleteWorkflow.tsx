import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMusicGeneration } from '@/hooks/useMusicGeneration';
import { Music, FileText, Play, Download } from 'lucide-react';
import GenerationProgress from './GenerationProgress';

export default function CompleteWorkflow() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('pop');
  const [instrumental, setInstrumental] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState('');
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [stage, setStage] = useState<'prompt' | 'lyrics' | 'music' | 'complete'>('prompt');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { generateMusic, isGenerating, currentJob } = useMusicGeneration();

  const handleGenerateLyrics = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите описание",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingLyrics(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lyrics', {
        body: {
          prompt: prompt.trim(),
          style: style,
          language: 'russian',
          structure: 'verse-chorus',
        },
      });

      if (error) throw error;

      toast({
        title: "Генерация лирики запущена",
        description: "Ожидайте результат через несколько минут..."
      });
      
      setStage('lyrics');
      
      // Polling for lyrics
      const pollLyrics = setInterval(async () => {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (!currentUser) return;
          
          const { data: lyricsData } = await supabase
            .from('lyrics')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (lyricsData && lyricsData.content !== 'Генерация лирики в процессе... Ожидайте результат.') {
            setGeneratedLyrics(lyricsData.content);
            clearInterval(pollLyrics);
            setIsGeneratingLyrics(false);
            toast({
              title: "Лирика готова!",
              description: "Теперь можно сгенерировать музыку"
            });
          }
        } catch (error) {
          console.error('Error polling lyrics:', error);
        }
      }, 5000);
      
      setTimeout(() => {
        clearInterval(pollLyrics);
        setIsGeneratingLyrics(false);
      }, 300000); // 5 минут
      
    } catch (error) {
      console.error('Error generating lyrics:', error);
      toast({
        title: "Ошибка",
        description: "Ошибка при генерации лирики",
        variant: "destructive"
      });
      setIsGeneratingLyrics(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка", 
        description: "Введите описание",
        variant: "destructive"
      });
      return;
    }

    try {
      setStage('music');
      await generateMusic({
        prompt: prompt.trim(),
        provider: 'suno',
        model: 'V4_5',
        style: style,
        duration: 120,
        instrumental: instrumental,
        lyrics: instrumental ? undefined : generatedLyrics
      });
    } catch (error) {
      console.error('Music generation error:', error);
    }
  };

  const handleCompleteWorkflow = async () => {
    if (instrumental) {
      // Сразу генерируем музыку для инструментальных треков
      await handleGenerateMusic();
    } else {
      // Сначала генерируем лирику, потом музыку
      await handleGenerateLyrics();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Полный цикл создания трека
          </CardTitle>
          <CardDescription>
            Создайте полноценный трек: от идеи до готовой композиции
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Описание трека</Label>
            <Textarea
              id="description"
              placeholder="Например: Энергичная поп-песня о летних приключениях с синтезаторами"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Стиль музыки</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pop">Поп</SelectItem>
                  <SelectItem value="rock">Рок</SelectItem>
                  <SelectItem value="electronic">Электронная</SelectItem>
                  <SelectItem value="hip-hop">Хип-хоп</SelectItem>
                  <SelectItem value="jazz">Джаз</SelectItem>
                  <SelectItem value="classical">Классическая</SelectItem>
                  <SelectItem value="ambient">Эмбиент</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="instrumental"
                checked={instrumental}
                onCheckedChange={setInstrumental}
              />
              <Label htmlFor="instrumental">Инструментальный трек</Label>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center space-x-2 ${stage === 'prompt' ? 'text-primary' : stage === 'lyrics' || stage === 'music' || stage === 'complete' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
              <div className={`w-3 h-3 rounded-full ${stage === 'prompt' ? 'bg-primary' : 'bg-muted'}`} />
              <span className="text-sm">Идея</span>
            </div>
            
            {!instrumental && (
              <>
                <div className="h-0.5 w-8 bg-muted" />
                <div className={`flex items-center space-x-2 ${stage === 'lyrics' ? 'text-primary' : stage === 'music' || stage === 'complete' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                  <div className={`w-3 h-3 rounded-full ${stage === 'lyrics' || (stage === 'music' && generatedLyrics) || stage === 'complete' ? 'bg-primary' : isGeneratingLyrics ? 'bg-yellow-500 animate-pulse' : 'bg-muted'}`} />
                  <span className="text-sm">Текст</span>
                </div>
              </>
            )}
            
            <div className="h-0.5 w-8 bg-muted" />
            <div className={`flex items-center space-x-2 ${stage === 'music' ? 'text-primary' : stage === 'complete' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
              <div className={`w-3 h-3 rounded-full ${stage === 'music' || stage === 'complete' ? 'bg-primary' : isGenerating ? 'bg-yellow-500 animate-pulse' : 'bg-muted'}`} />
              <span className="text-sm">Музыка</span>
            </div>
            
            <div className="h-0.5 w-8 bg-muted" />
            <div className={`flex items-center space-x-2 ${stage === 'complete' ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-3 h-3 rounded-full ${stage === 'complete' ? 'bg-primary' : 'bg-muted'}`} />
              <span className="text-sm">Готово</span>
            </div>
          </div>

          {/* Action buttons */}
          {stage === 'prompt' && (
            <Button 
              onClick={handleCompleteWorkflow}
              disabled={!prompt.trim() || isGeneratingLyrics || isGenerating}
              className="w-full"
              size="lg"
            >
              <Music className="h-4 w-4 mr-2" />
              {instrumental ? 'Создать инструментальный трек' : 'Начать создание трека'}
            </Button>
          )}

          {stage === 'lyrics' && !instrumental && (
            <div className="space-y-4">
              {isGeneratingLyrics ? (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">Генерируем текст песни...</p>
                  <div className="animate-pulse">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                  </div>
                </div>
              ) : generatedLyrics ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm">{generatedLyrics}</pre>
                  </div>
                  <Button 
                    onClick={handleGenerateMusic}
                    disabled={isGenerating}
                    className="w-full"
                    size="lg"
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Создать музыку с этим текстом
                  </Button>
                </div>
              ) : null}
            </div>
          )}

          {/* Music generation progress */}
          {(isGenerating || currentJob) && (
            <GenerationProgress job={currentJob} onReset={() => setStage('prompt')} />
          )}

          {/* Complete track display */}
          {currentJob?.status === 'completed' && currentJob.track && (
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Ваш трек готов!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{currentJob.track.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Длительность: {Math.floor(currentJob.track.duration / 60)}:{(currentJob.track.duration % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={currentJob.track.file_url} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                
                <audio controls className="w-full">
                  <source src={currentJob.track.file_url} type="audio/mpeg" />
                  Ваш браузер не поддерживает аудио элемент.
                </audio>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}