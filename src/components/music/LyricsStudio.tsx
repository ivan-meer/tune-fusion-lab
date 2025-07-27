import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PenTool, Copy, Download, Share, Music } from 'lucide-react';

interface GeneratedLyrics {
  id: string;
  content: string;
  title: string;
  style: string;
  language: string;
  created_at: string;
}

export default function LyricsStudio() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('pop');
  const [language, setLanguage] = useState('russian');
  const [structure, setStructure] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState<GeneratedLyrics[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, введите описание лирики",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-lyrics', {
        body: {
          prompt: prompt.trim(),
          style: style || undefined,
          language: language || undefined,
          structure: structure || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Генерация запущена",
        description: "Генерация лирики запущена! Результат появится через несколько минут."
      });
      
      console.log('Lyrics generation started:', data);
      
      // Start polling for updates every 10 seconds
      const pollInterval = setInterval(async () => {
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
          
          if (lyricsData && lyricsData.content !== 'Генерация текста в процессе... Ожидайте результат.') {
            await loadUserLyrics();
            clearInterval(pollInterval);
            toast({
              title: "Готово!",
              description: "Лирика успешно сгенерирована!"
            });
          }
        } catch (error) {
          console.error('Error polling lyrics:', error);
        }
      }, 10000);
      
      // Stop polling after 5 minutes
      setTimeout(() => clearInterval(pollInterval), 300000);
      
    } catch (error) {
      console.error('Error generating lyrics:', error);
      toast({
        title: "Ошибка",
        description: "Ошибка при генерации лирики",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const loadUserLyrics = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('lyrics')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setGeneratedLyrics(data || []);
    } catch (error) {
      console.error('Error loading lyrics:', error);
    }
  };

  useEffect(() => {
    loadUserLyrics();

    // Set up real-time subscription for lyrics updates
    const channel = supabase
      .channel('lyrics-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lyrics'
        },
        (payload) => {
          console.log('Lyrics updated:', payload);
          loadUserLyrics(); // Reload lyrics when updated
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const copyToClipboard = (lyrics: GeneratedLyrics) => {
    navigator.clipboard.writeText(lyrics.content);
    toast({
      title: "Скопировано!",
      description: "Текст скопирован в буфер обмена"
    });
  };

  const createMusicFromLyrics = (lyrics: GeneratedLyrics) => {
    toast({
      title: "Переход к созданию музыки",
      description: "Функция будет добавлена в следующей версии"
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Студия лирики
          </CardTitle>
          <CardDescription>
            Создавайте тексты песен с помощью ИИ. Опишите тему, настроение или стиль
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lyrics-prompt">Описание лирики</Label>
            <Textarea
              id="lyrics-prompt"
              placeholder="Например: Лирика о любви к родине, патриотическая, торжественная"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Стиль</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pop">Поп</SelectItem>
                  <SelectItem value="rock">Рок</SelectItem>
                  <SelectItem value="rap">Рэп</SelectItem>
                  <SelectItem value="ballad">Баллада</SelectItem>
                  <SelectItem value="folk">Фолк</SelectItem>
                  <SelectItem value="jazz">Джаз</SelectItem>
                  <SelectItem value="blues">Блюз</SelectItem>
                  <SelectItem value="country">Кантри</SelectItem>
                  <SelectItem value="ambient">Эмбиент</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Язык</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="russian">Русский</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Español</SelectItem>
                  <SelectItem value="french">Français</SelectItem>
                  <SelectItem value="german">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Структура</Label>
              <Select value={structure} onValueChange={setStructure}>
                <SelectTrigger>
                  <SelectValue placeholder="Любая" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Любая</SelectItem>
                  <SelectItem value="verse-chorus">Куплет-Припев</SelectItem>
                  <SelectItem value="verse-chorus-bridge">Полная структура</SelectItem>
                  <SelectItem value="simple">Простая</SelectItem>
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
            <PenTool className="h-4 w-4 mr-2" />
            {isGenerating ? 'Создаем лирику...' : 'Создать лирику'}
          </Button>
        </CardContent>
      </Card>

      {generatedLyrics.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Ваши тексты</h3>
          {generatedLyrics.map((lyrics) => (
            <Card key={lyrics.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{lyrics.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{lyrics.style}</Badge>
                    <Badge variant="outline">{lyrics.language}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-mono text-sm">
                    {lyrics.content}
                  </pre>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button onClick={() => copyToClipboard(lyrics)} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    Копировать
                  </Button>
                  
                  <Button onClick={() => createMusicFromLyrics(lyrics)} variant="outline" size="sm">
                    <Music className="h-4 w-4 mr-1" />
                    Создать музыку
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Скачать
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Share className="h-4 w-4 mr-1" />
                    Поделиться
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}