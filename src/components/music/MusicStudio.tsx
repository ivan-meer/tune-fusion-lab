import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMusicGeneration, GenerationRequest } from '@/hooks/useMusicGeneration';
import ModelSelector, { ModelType } from '@/components/ui/model-selector';
import AdminPanel from '@/components/ui/admin-panel';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import GenerationProgress from './GenerationProgress';
import { useToast } from '@/hooks/use-toast';
import { Wand2, Sparkles, Music2, Download, Share2, Shuffle, Zap, Settings, Mic, Volume2, FileText } from 'lucide-react';
import AdvancedMusicStudio from './AdvancedMusicStudio';

interface AudioPlayerProps {
  src: string;
  title: string;
}

// Elegant audio player component
function AudioPlayer({ src, title }: AudioPlayerProps) {
  return (
    <motion.div 
      className="glassmorphism p-6 rounded-xl border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium gradient-text">{title}</h4>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="hover:bg-white/10 border border-white/20">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="hover:bg-white/10 border border-white/20">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <audio controls className="w-full modern-audio-player">
        <source src={src} type="audio/mpeg" />
        Ваш браузер не поддерживает аудио элемент.
      </audio>
    </motion.div>
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
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  
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
    
    try {
      // Try to use the new style-enhance edge function
      const { data, error } = await supabase.functions.invoke('style-enhance', {
        body: { content: prompt }
      });

      if (data?.success && data.enhancedStyle) {
        setPrompt(data.enhancedStyle);
        toast({
          title: "Промпт улучшен с помощью ИИ!",
          description: `Использован метод: ${data.method || 'suno_api'}`
        });
      } else {
        throw new Error(data?.error || 'Enhancement failed');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      
      // Fallback to local enhancement
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
      
      toast({
        title: "Промпт улучшен локально",
        description: "Добавлены профессиональные детали"
      });
    }
    
    setIsEnhancing(false);
  };

  const generateLyrics = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Укажите описание",
        description: "Опишите тему или настроение для генерации лирики",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingLyrics(true);

    try {
      // Создаем профессиональный промпт для генерации лирики с тегами Suno AI
      const lyricsPrompt = `Создай профессиональную лирику для ${style} песни на тему: "${prompt}". 
      
Требования:
- Структура: [Verse], [Chorus], [Verse], [Chorus], [Bridge], [Chorus], [Outro]
- Язык: русский
- Стиль: ${style}
- Настроение соответствует описанию: ${prompt}
- Добавь теги в формате Suno AI в начале
- Рифмы должны быть естественными и красивыми
- Текст должен быть эмоциональным и запоминающимся
- Используй современную поэтику

Пример структуры с тегами:
[Intro]
[Verse]
текст куплета...
[Chorus]  
текст припева...

Создай полноценный текст песни с правильной структурой и тегами.`;

      const { data, error } = await supabase.functions.invoke('generate-lyrics', {
        body: { 
          prompt: lyricsPrompt,
          style: style,
          language: 'russian',
          structure: 'verse-chorus'
        }
      });

      if (data?.success && data.lyrics?.content) {
        setLyrics(data.lyrics.content);
        toast({
          title: "🎤 Лирика сгенерирована!",
          description: "Текст песни создан с помощью ИИ"
        });
      } else {
        throw new Error(data?.error || error?.message || 'Не удалось сгенерировать лирику');
      }
    } catch (error) {
      console.error('Lyrics generation error:', error);
      toast({
        title: "❌ Ошибка генерации лирики",
        description: error.message || "Попробуйте еще раз",
        variant: "destructive"
      });
    }

    setIsGeneratingLyrics(false);
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
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-4 md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Section */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full glassmorphism border border-white/10">
            <Music2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-medium gradient-text">Студия ИИ</h1>
            <AudioVisualizer isPlaying={isGenerating} barCount={5} className="h-6" />
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Создавайте уникальную музыку с помощью искусственного интеллекта. 
            Просто опишите желаемый трек и получите профессиональный результат.
          </p>
        </motion.div>

        {/* Admin Panel - Hidden by default */}
        <AnimatePresence>
          {showAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AdminPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Studio Interface */}
        <AnimatedCard 
          variant="glass" 
          className="backdrop-blur-xl border-white/10 overflow-hidden"
        >
          <div className="p-8 space-y-8">
            {!currentJob ? (
              <motion.div 
                className="space-y-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {/* Creative Prompt Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-medium">Опишите ваш трек</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={generateRandomPrompt}
                        className="hover:bg-white/10 border border-white/20"
                      >
                        <Shuffle className="h-4 w-4 mr-2" />
                        Случайный
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={enhancePrompt}
                        disabled={isEnhancing}
                        className="hover:bg-white/10 border border-white/20"
                      >
                        <Zap className={`h-4 w-4 mr-2 ${isEnhancing ? 'animate-pulse text-yellow-400' : ''}`} />
                        {isEnhancing ? 'Улучшаю...' : 'Улучшить с ИИ'}
                      </Button>
                    </div>
                  </div>
                  
                  <motion.div
                    whileFocus={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <Textarea
                      id="prompt"
                      placeholder="Энергичная поп-песня о лете с яркими синтезаторами и женским вокалом..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={3}
                      className="glassmorphism border-white/20 bg-white/5 backdrop-blur-sm resize-none text-lg"
                    />
                  </motion.div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Provider Selection */}
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Label className="text-sm font-medium text-muted-foreground">ИИ Модель</Label>
                    <Select value={provider} onValueChange={handleProviderChange}>
                      <SelectTrigger className="glassmorphism border-white/20 bg-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glassmorphism border-white/20 bg-background/95 backdrop-blur-xl">
                        <SelectItem value="suno">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-yellow-400" />
                            Suno AI
                          </div>
                        </SelectItem>
                        <SelectItem value="mureka">
                          <div className="flex items-center gap-2">
                            <Music2 className="h-4 w-4 text-blue-400" />
                            Mureka AI
                          </div>
                        </SelectItem>
                        <SelectItem value="test">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-green-400" />
                            Тест
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* Style Selection */}
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Label className="text-sm font-medium text-muted-foreground">Жанр</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="glassmorphism border-white/20 bg-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glassmorphism border-white/20 bg-background/95 backdrop-blur-xl">
                        <SelectItem value="pop">🎵 Поп</SelectItem>
                        <SelectItem value="rock">🎸 Рок</SelectItem>
                        <SelectItem value="electronic">🎛️ Электронная</SelectItem>
                        <SelectItem value="hip-hop">🎤 Хип-хоп</SelectItem>
                        <SelectItem value="classical">🎼 Классическая</SelectItem>
                        <SelectItem value="jazz">🎺 Джаз</SelectItem>
                        <SelectItem value="ambient">🌊 Эмбиент</SelectItem>
                        <SelectItem value="folk">🪕 Фолк</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* Duration Control */}
                  <motion.div 
                    className="space-y-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                  >
                    <Label className="text-sm font-medium text-muted-foreground">
                      Длительность: {duration[0]}с
                    </Label>
                    <div className="glassmorphism p-4 rounded-lg border border-white/20 bg-white/5">
                      <Slider
                        value={duration}
                        onValueChange={setDuration}
                        max={180}
                        min={30}
                        step={15}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>30с</span>
                        <span>180с</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Model Selector */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <ModelSelector
                    value={model}
                    onChange={setModel}
                    provider={provider}
                    showDetails={true}
                  />
                </motion.div>

                {/* Advanced Options */}
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                >
                  <div className="flex items-center justify-between p-4 glassmorphism rounded-lg border border-white/20 bg-white/5">
                    <div className="flex items-center gap-3">
                      <Mic className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-sm font-medium">Инструментальная версия</Label>
                        <p className="text-xs text-muted-foreground">Трек без вокала</p>
                      </div>
                    </div>
                    <Switch
                      checked={instrumental}
                      onCheckedChange={setInstrumental}
                    />
                  </div>

                  <AnimatePresence>
                    {!instrumental && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-muted-foreground">
                            Текст песни (опционально)
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={generateLyrics}
                            disabled={isGeneratingLyrics || !prompt.trim()}
                            className="hover:bg-white/10 border border-white/20"
                          >
                            <FileText className={`h-4 w-4 mr-2 ${isGeneratingLyrics ? 'animate-pulse text-blue-400' : ''}`} />
                            {isGeneratingLyrics ? 'Генерирую...' : 'Сгенерировать с ИИ'}
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Введите текст песни или нажмите 'Сгенерировать с ИИ' для автогенерации..."
                          value={lyrics}
                          onChange={(e) => setLyrics(e.target.value)}
                          rows={6}
                          className="glassmorphism border-white/20 bg-white/5 backdrop-blur-sm resize-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Generate Button */}
                <motion.div 
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <motion.div
                    className="flex-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      onClick={handleGenerate} 
                      disabled={isGenerating || !prompt.trim()}
                      className="w-full h-14 text-lg font-medium gradient-primary hover:shadow-glow transition-all duration-300"
                      size="lg"
                    >
                      <div className="flex items-center gap-3">
                        {isGenerating ? (
                          <>
                            <Volume2 className="h-5 w-5 animate-pulse" />
                            <span>Создаю музыку...</span>
                            <AudioVisualizer isPlaying={true} barCount={4} className="h-5" />
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            <span>Создать музыку</span>
                          </>
                        )}
                      </div>
                    </Button>
                  </motion.div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(true)}
                    className="hover:bg-white/10 border border-white/20"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Расширенный режим
                  </Button>
                </motion.div>

                {/* Quick Actions */}
                <motion.div 
                  className="flex justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.9 }}
                >
                  <Button 
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.functions.invoke('test-auth');
                        if (data?.success) {
                          toast({
                            title: "✅ Соединение установлено",
                            description: "Сервер готов к работе"
                          });
                        } else {
                          toast({
                            title: "❌ Ошибка соединения",
                            description: data?.error || error?.message,
                            variant: "destructive"
                          });
                        }
                      } catch (err) {
                        toast({
                          title: "❌ Ошибка подключения",
                          description: `${err.message}`,
                          variant: "destructive"
                        });
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Проверить соединение
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdmin(!showAdmin)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showAdmin ? 'Скрыть' : 'Показать'} логи
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <GenerationProgress 
                  job={currentJob}
                  onReset={resetGeneration}
                  onRetry={currentJob.status === 'failed' ? handleRetry : undefined}
                />
              </motion.div>
            )}
          </div>
        </AnimatedCard>
      </div>
    </motion.div>
  );
}