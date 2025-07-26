import { useState } from 'react';
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
}

export default function LyricsStudio() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('pop');
  const [language, setLanguage] = useState('russian');
  const [structure, setStructure] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLyrics, setGeneratedLyrics] = useState<GeneratedLyrics | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!user) return;

    try {
      setIsGenerating(true);
      
      const { data, error } = await supabase.functions.invoke('generate-lyrics', {
        body: {
          prompt,
          style,
          language,
          structure
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate lyrics');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Lyrics generation failed');
      }

      setGeneratedLyrics(data.lyrics);
      
      toast({
        title: "Лирика создана!",
        description: `Создан текст в стиле ${style}`
      });

    } catch (error) {
      console.error('Lyrics generation error:', error);
      toast({
        title: "Ошибка генерации",
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLyrics) {
      navigator.clipboard.writeText(generatedLyrics.content);
      toast({
        title: "Скопировано!",
        description: "Текст скопирован в буфер обмена"
      });
    }
  };

  const createMusicFromLyrics = () => {
    if (generatedLyrics) {
      // Интеграция с MusicStudio - передать лирику
      toast({
        title: "Переход к созданию музыки",
        description: "Функция будет добавлена в следующей версии"
      });
    }
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
              <Label>Структура (опционально)</Label>
              <Select value={structure} onValueChange={setStructure}>
                <SelectTrigger>
                  <SelectValue placeholder="Любая" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Любая</SelectItem>
                  <SelectItem value="verse-chorus-verse-chorus-bridge-chorus">Классическая</SelectItem>
                  <SelectItem value="verse-chorus-verse-chorus">Простая</SelectItem>
                  <SelectItem value="intro-verse-chorus-verse-chorus-outro">Полная</SelectItem>
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

      {generatedLyrics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{generatedLyrics.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{generatedLyrics.style}</Badge>
                <Badge variant="outline">{generatedLyrics.language}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <pre className="whitespace-pre-wrap font-mono text-sm">
                {generatedLyrics.content}
              </pre>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-1" />
                Копировать
              </Button>
              
              <Button onClick={createMusicFromLyrics} variant="outline" size="sm">
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
      )}
    </div>
  );
}