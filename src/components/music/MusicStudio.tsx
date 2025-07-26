import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMusicGeneration, GenerationRequest } from '@/hooks/useMusicGeneration';
import { Wand2, Sparkles, Music, Play, Download, Share, Shuffle, Zap } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title: string;
}

// Simple audio player component
function AudioPlayer({ src, title }: AudioPlayerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">{title}</h4>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Скачать
          </Button>
          <Button size="sm" variant="outline">
            <Share className="h-4 w-4 mr-1" />
            Поделиться
          </Button>
        </div>
      </div>
      <audio controls className="w-full">
        <source src={src} type="audio/mpeg" />
        Ваш браузер не поддерживает аудио элемент.
      </audio>
    </div>
  );
}

export default function MusicStudio() {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'mureka' | 'suno'>('suno');
  const [style, setStyle] = useState('pop');
  const [duration, setDuration] = useState([60]);
  const [instrumental, setInstrumental] = useState(false);
  const [lyrics, setLyrics] = useState('');
  
  const { user } = useAuth();
  const { generateMusic, resetGeneration, isGenerating, currentJob } = useMusicGeneration();

  // Массивы для генерации случайных промптов
  const moods = ['энергичная', 'меланхоличная', 'романтичная', 'драйвовая', 'спокойная', 'мистическая', 'веселая', 'мечтательная'];
  const instruments = ['синтезаторы', 'гитара', 'пианино', 'скрипка', 'саксофон', 'барабаны', 'бас-гитара', 'флейта'];
  const vocals = ['мужской вокал', 'женский вокал', 'хор', 'рэп', 'фальцет', 'низкий бас'];
  const themes = ['о любви', 'о мечтах', 'о приключениях', 'о дружбе', 'о свободе', 'о природе', 'о городе', 'о будущем'];
  const tempos = ['быстрый', 'медленный', 'средний', 'переменчивый'];

  const generateRandomPrompt = () => {
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const instrument = instruments[Math.floor(Math.random() * instruments.length)];
    const vocal = vocals[Math.floor(Math.random() * vocals.length)];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const tempo = tempos[Math.floor(Math.random() * tempos.length)];
    
    const randomPrompt = `${mood} песня ${theme} с ${instrument} и ${vocal}, ${tempo} темп`;
    setPrompt(randomPrompt);
  };

  const enhancePrompt = () => {
    if (!prompt.trim()) {
      generateRandomPrompt();
      return;
    }
    
    const enhancements = [
      'с богатой аранжировкой',
      'с профессиональным звучанием',
      'в студийном качестве',
      'с эмоциональной подачей',
      'с современным продакшеном',
      'с динамичными переходами',
      'с запоминающимся припевом',
      'с глубоким басом'
    ];
    
    const enhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
    setPrompt(prev => `${prev}, ${enhancement}`);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      return;
    }

    if (!user) {
      return;
    }

    const request: GenerationRequest = {
      prompt,
      provider,
      style,
      duration: duration[0],
      instrumental,
      lyrics: instrumental ? undefined : lyrics
    };

    try {
      await generateMusic(request);
    } catch (error) {
      console.error('Generation error:', error);
    }
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt">Описание трека</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateRandomPrompt}
                      className="text-xs"
                    >
                      <Shuffle className="h-3 w-3 mr-1" />
                      Случайный
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={enhancePrompt}
                      className="text-xs"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Улучшить
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="prompt"
                  placeholder="Например: Энергичная поп-песня о лете с яркими синтезаторами и женским вокалом"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
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
                            Suno AI (10 кредитов)
                          </div>
                        </SelectItem>
                        <SelectItem value="mureka">
                          <div className="flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            Mureka AI (15 кредитов)
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
                        <SelectItem value="jazz">Джаз</SelectItem>
                        <SelectItem value="ambient">Эмбиент</SelectItem>
                        <SelectItem value="folk">Фолк</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Длительность: {duration[0]} сек</Label>
                    <Slider
                      value={duration}
                      onValueChange={setDuration}
                      max={180}
                      min={30}
                      step={15}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="instrumental"
                      checked={instrumental}
                      onCheckedChange={setInstrumental}
                    />
                    <Label htmlFor="instrumental">Инструментальная версия</Label>
                  </div>

                  {!instrumental && (
                    <div className="space-y-2">
                      <Label htmlFor="lyrics">Текст песни (опционально)</Label>
                      <Textarea
                        id="lyrics"
                        placeholder="Введите текст песни или оставьте пустым для автогенерации"
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        rows={6}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="w-full"
                size="lg"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {isGenerating ? 'Создаем...' : 'Создать музыку'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Генерация в процессе</h3>
                <Badge variant={currentJob.status === 'completed' ? 'default' : 'secondary'}>
                  {currentJob.status === 'processing' ? 'Обработка' : 
                   currentJob.status === 'completed' ? 'Завершено' : 
                   currentJob.status === 'failed' ? 'Ошибка' : 'Ожидание'}
                </Badge>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Промпт:</p>
                <p className="text-sm">{prompt}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>Провайдер: {provider}</span>
                  <span>Стиль: {style}</span>
                  <span>Длительность: {duration[0]}с</span>
                  {instrumental && <span>Инструментальная</span>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Прогресс</span>
                  <span>{Math.round(currentJob.progress)}%</span>
                </div>
                <Progress value={currentJob.progress} className="h-2" />
              </div>

              {currentJob.status === 'completed' && currentJob.track && (
                <div className="space-y-4">
                  <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-2">Трек готов!</p>
                    <AudioPlayer 
                      src={currentJob.track.file_url} 
                      title={currentJob.track.title}
                    />
                  </div>
                  
                  <Button onClick={resetGeneration} variant="outline" className="w-full">
                    Создать новый трек
                  </Button>
                </div>
              )}

              {currentJob.status === 'failed' && (
                <div className="space-y-3">
                  <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                    <p className="text-sm font-medium text-destructive">Ошибка генерации</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Попробуйте изменить промпт или выбрать другого провайдера
                    </p>
                  </div>
                  
                  <Button onClick={resetGeneration} variant="outline" className="w-full">
                    Попробовать снова
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