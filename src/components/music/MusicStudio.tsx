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
import ModelSelector, { ModelType } from '@/components/ui/model-selector';
import AdminPanel from '@/components/ui/admin-panel';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import GenerationProgress from './GenerationProgress';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Sparkles, Music, Play, Download, Share, Shuffle, Zap, ArrowRight } from 'lucide-react';
import AdvancedMusicStudio from './AdvancedMusicStudio';

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
  const [provider, setProvider] = useState<'mureka' | 'suno' | 'test'>('suno');
  const [model, setModel] = useState<ModelType>('V4_5');
  const [style, setStyle] = useState('pop');
  const [duration, setDuration] = useState([60]);
  const [instrumental, setInstrumental] = useState(false);
  const [lyrics, setLyrics] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { user } = useAuth();
  const { generateMusic, resetGeneration, isGenerating, currentJob } = useMusicGeneration();
  const { toast } = useToast();
  
  // Real-time updates for generation jobs
  useRealtimeUpdates({
    onJobUpdate: () => {
      console.log('Generation job update detected');
    }
  });

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

  const enhancePrompt = async () => {
    if (!prompt.trim()) {
      generateRandomPrompt();
      return;
    }
    
    setIsEnhancing(true);
    
    // Add AI-powered enhancement simulation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const enhancements = [
      'с богатой аранжировкой и многослойным звучанием',
      'с профессиональным студийным качеством и мастерингом',
      'с эмоциональной подачей и динамичными переходами',
      'с современным продакшеном и пространственными эффектами',
      'с запоминающимся мелодическим крюком и гармоничными аккордами',
      'с глубоким басом и четкой ритм-секцией',
      'с атмосферными подложками и реверберацией',
      'с кинематографичным звучанием и оркестровыми элементами'
    ];
    
    const enhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
    setPrompt(prev => `${prev}, ${enhancement}`);
    setIsEnhancing(false);
    
    toast({
      title: "Промпт улучшен!",
      description: "Добавлены профессиональные детали для лучшего результата"
    });
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
      model,
      style,
      duration: duration[0],
      instrumental,
      lyrics: instrumental ? undefined : lyrics
    };

    try {
      await generateMusic(request);
    } catch (error) {
      console.error('Generation error:', error);
      // Error is already handled in the hook
    }
  };

  const handleRetry = () => {
    if (currentJob) {
      resetGeneration();
      // Small delay to ensure state is reset
      setTimeout(() => {
        handleGenerate();
      }, 100);
    }
  };

  // Update model when provider changes
  const handleProviderChange = (newProvider: 'mureka' | 'suno' | 'test') => {
    setProvider(newProvider);
    // Auto-select best model for provider
    if (newProvider === 'suno') {
      setModel('V4_5');
    } else if (newProvider === 'mureka') {
      setModel('mureka-v6');
    } else {
      setModel('test');
    }
  };

  if (showAdvanced) {
    return <AdvancedMusicStudio />;
  }

  return (
    <div className="space-y-6">
      {showAdmin && <AdminPanel />}
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Генерация музыки с ИИ
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvanced(true)}
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                Продвинутый режим
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdmin(!showAdmin)}
              >
                {showAdmin ? 'Скрыть логи' : 'Показать логи'}
              </Button>
            </div>
          </div>
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
                      disabled={isEnhancing}
                      className="text-xs"
                    >
                      <Zap className={`h-3 w-3 mr-1 ${isEnhancing ? 'animate-pulse' : ''}`} />
                      {isEnhancing ? 'Обработка...' : 'Улучшить'}
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
                    <Select value={provider} onValueChange={handleProviderChange}>
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
                        <SelectItem value="test">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Тест
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ModelSelector
                    value={model}
                    onChange={setModel}
                    provider={provider}
                    showDetails={true}
                  />

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
              
              <Button 
                onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke('test-auth');
                    console.log('Test auth result:', { data, error });
                    if (data?.success) {
                      toast({
                        title: "Аутентификация работает!",
                        description: "Соединение с сервером установлено"
                      });
                    } else {
                      toast({
                        title: "Ошибка аутентификации",
                        description: data?.error || error?.message,
                        variant: "destructive"
                      });
                    }
                  } catch (err) {
                    console.error('Test auth error:', err);
                    toast({
                      title: "Ошибка соединения",
                      description: `${err.message}`,
                      variant: "destructive"
                    });
                  }
                }}
                variant="outline"
                className="w-full"
                size="sm"
              >
                Тест соединения
              </Button>
            </>
          ) : (
            <GenerationProgress 
              job={currentJob}
              onReset={resetGeneration}
              onRetry={currentJob.status === 'failed' ? handleRetry : undefined}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}