/**
 * Unified Music Studio Component
 * 
 * Объединяет простую и продвинутую генерацию музыки в один компонент
 * с переключаемыми режимами для упрощения интерфейса
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMusicGeneration, GenerationRequest } from '@/hooks/useMusicGeneration';
import ModelSelector, { ModelType } from '@/components/ui/model-selector';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import GenerationProgress from './GenerationProgress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getGenerationStatusText } from '@/hooks/useGenerationStatusText';
import { 
  Wand2, Sparkles, Music, Shuffle, Zap, Volume2, Brain, 
  Mic, Guitar, Piano, Drum, Waves, Settings, 
  ChevronDown, ChevronUp, Lightbulb, FileText, RefreshCw
} from 'lucide-react';

type StudioMode = 'simple' | 'advanced';

export default function UnifiedMusicStudio() {
  // Core state
  const [mode, setMode] = useState<StudioMode>('simple');
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'mureka' | 'suno' | 'test'>('suno');
  const [model, setModel] = useState<ModelType>('V4_5');
  const [style, setStyle] = useState('pop');
  const [duration, setDuration] = useState([120]);
  const [instrumental, setInstrumental] = useState(false);
  const [lyrics, setLyrics] = useState('');

  // Advanced options (только для продвинутого режима)
  const [energy, setEnergy] = useState([50]);
  const [mood, setMood] = useState('neutral');
  const [tempo, setTempo] = useState([120]);
  const [complexity, setComplexity] = useState([50]);
  const [instruments, setInstruments] = useState<string[]>([]);

  // UI state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isGeneratingAILyrics, setIsGeneratingAILyrics] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { user } = useAuth();
  const { generateMusic, resetGeneration, isGenerating, currentJob } = useMusicGeneration();
  const { toast } = useToast();

  // Real-time updates
  useRealtimeUpdates({
    onJobUpdate: () => {
      console.log('Generation job update detected');
    }
  });

  // Simple mode suggestions
  const simpleSuggestions = [
    'Энергичная поп-песня о лете с яркими синтезаторами',
    'Романтическая баллада с нежным женским вокалом',
    'Танцевальный электронный трек с пульсирующим басом',
    'Спокойная акустическая композиция с гитарой',
    'Динамичный рок-трек с мощными барабанами'
  ];

  // Advanced mode options
  const moodOptions = [
    { value: 'neutral', label: 'Нейтральное', icon: '😐' },
    { value: 'happy', label: 'Радостное', icon: '😊' },
    { value: 'melancholic', label: 'Меланхоличное', icon: '😢' },
    { value: 'energetic', label: 'Энергичное', icon: '⚡' },
    { value: 'calm', label: 'Спокойное', icon: '😌' },
    { value: 'mysterious', label: 'Мистическое', icon: '🔮' },
    { value: 'romantic', label: 'Романтичное', icon: '💕' },
    { value: 'epic', label: 'Эпичное', icon: '🏰' }
  ];

  const instrumentOptions = [
    { value: 'piano', label: 'Фортепиано', icon: Piano },
    { value: 'guitar', label: 'Гитара', icon: Guitar },
    { value: 'drums', label: 'Барабаны', icon: Drum },
    { value: 'synthesizer', label: 'Синтезатор', icon: Waves },
    { value: 'vocals', label: 'Вокал', icon: Mic },
    { value: 'strings', label: 'Струнные', icon: Music }
  ];

  // Generate AI prompt
  const generateAIPrompt = async () => {
    setIsGeneratingPrompt(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-prompt-generator', {
        body: { 
          type: 'music', 
          style: style,
          context: prompt || `${style} музыка`
        }
      });

      if (data?.success && data.prompt) {
        setPrompt(data.prompt);
        toast({
          title: "Промпт сгенерирован!",
          description: "ИИ создал креативное описание для вашего трека"
        });
      } else {
        throw new Error(data?.error || 'Prompt generation failed');
      }
    } catch (error) {
      console.error('AI prompt generation error:', error);
      
      // Fallback to random suggestion
      generateRandomPrompt();
      
      toast({
        title: "Промпт создан локально",
        description: "Использован случайный вариант"
      });
    }
    
    setIsGeneratingPrompt(false);
  };

  // Generate random prompt for simple mode
  const generateRandomPrompt = () => {
    const suggestion = simpleSuggestions[Math.floor(Math.random() * simpleSuggestions.length)];
    setPrompt(suggestion);
  };

  // Enhance prompt with AI
  const enhancePrompt = async () => {
    if (!prompt.trim()) {
      generateRandomPrompt();
      return;
    }
    
    setIsEnhancing(true);
    
    try {
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
        'с профессиональным студийным качеством',
        'с эмоциональной подачей и динамичными переходами',
        'с современным продакшеном и пространственными эффектами'
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

  // Generate lyrics
  const generateLyrics = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Укажите описание",
        description: "Опишите тему для генерации лирики",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingLyrics(true);

    try {
      const lyricsPrompt = `${style} песня о ${prompt.substring(0, 100)}...`.substring(0, 200);
      
      const { data, error } = await supabase.functions.invoke('generate-lyrics', {
        body: { 
          prompt: lyricsPrompt,
          style: style,
          language: 'russian',
          structure: 'verse-chorus'
        }
      });

      if (data?.success && data.lyrics) {
        const lyricsId = data.lyrics.id;
        
        const checkExistingLyrics = async () => {
          const { data: existingLyrics } = await supabase
            .from('lyrics')
            .select('content')
            .eq('id', lyricsId)
            .single();
            
          if (existingLyrics?.content && existingLyrics.content !== "Генерация лирики в процессе... Ожидайте результат.") {
            setLyrics(existingLyrics.content);
            setIsGeneratingLyrics(false);
            toast({
              title: "🎤 Лирика сгенерирована!",
              description: "Текст песни создан с помощью ИИ"
            });
            return true;
          }
          return false;
        };

        const isReady = await checkExistingLyrics();
        
        if (!isReady) {
          const pollInterval = setInterval(async () => {
            const isNowReady = await checkExistingLyrics();
            if (isNowReady) {
              clearInterval(pollInterval);
            }
          }, 3000);

          setTimeout(() => {
            clearInterval(pollInterval);
            if (isGeneratingLyrics) {
              setIsGeneratingLyrics(false);
              toast({
                title: "⏰ Генерация занимает больше времени",
                description: "Попробуйте обновить страницу через минуту",
                variant: "destructive"
              });
            }
          }, 120000);

          toast({
            title: "🎵 Генерация лирики начата",
            description: "Ожидайте результат, это может занять несколько минут"
          });
        }
      } else {
        throw new Error(data?.error || error?.message || 'Не удалось сгенерировать лирику');
      }
    } catch (error) {
      console.error('Lyrics generation error:', error);
      setIsGeneratingLyrics(false);
      toast({
        title: "❌ Ошибка генерации лирики",
        description: error.message || "Попробуйте еще раз",
        variant: "destructive"
      });
    }
  };

  // Generate AI lyrics prompt
  const generateAILyrics = async () => {
    setIsGeneratingAILyrics(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-prompt-generator', {
        body: { 
          type: 'lyrics', 
          style: style,
          context: prompt,
          language: 'russian'
        }
      });

      if (data?.success && data.prompt) {
        setLyrics(data.prompt);
        toast({
          title: "Текст сгенерирован!",
          description: "ИИ создал описание для генерации лирики"
        });
      } else {
        throw new Error(data?.error || 'Lyrics prompt generation failed');
      }
    } catch (error) {
      console.error('AI lyrics generation error:', error);
      toast({
        title: "Ошибка генерации",
        description: "Попробуйте еще раз",
        variant: "destructive"
      });
    }
    
    setIsGeneratingAILyrics(false);
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return;

    // ИСПРАВЛЕНИЕ: Правильная передача лирики
    const finalLyrics = instrumental ? undefined : (lyrics.trim() || undefined);

    const request: GenerationRequest = {
      prompt: mode === 'advanced' ? buildEnhancedPrompt() : prompt,
      provider,
      model,
      style,
      duration: duration[0],
      instrumental,
      lyrics: finalLyrics
    };

    try {
      await generateMusic(request);
    } catch (error) {
      console.error('Generation error:', error);
    }
  };

  // Build enhanced prompt for advanced mode
  const buildEnhancedPrompt = () => {
    let enhancedPrompt = prompt;
    
    const selectedMood = moodOptions.find(m => m.value === mood);
    if (selectedMood && mood !== 'neutral') {
      enhancedPrompt += `, ${selectedMood.label.toLowerCase()} настроение`;
    }
    
    if (tempo[0] < 80) {
      enhancedPrompt += ', медленный темп';
    } else if (tempo[0] > 140) {
      enhancedPrompt += ', быстрый темп';
    }
    
    if (energy[0] > 70) {
      enhancedPrompt += ', высокая энергетика';
    } else if (energy[0] < 30) {
      enhancedPrompt += ', спокойное звучание';
    }
    
    if (instruments.length > 0) {
      enhancedPrompt += `, акцент на ${instruments.join(', ')}`;
    }
    
    return enhancedPrompt;
  };

  const toggleInstrument = (instrument: string) => {
    setInstruments(prev => 
      prev.includes(instrument) 
        ? prev.filter(i => i !== instrument)
        : [...prev, instrument]
    );
  };

  const handleProviderChange = (newProvider: 'mureka' | 'suno' | 'test') => {
    setProvider(newProvider);
    if (newProvider === 'suno') {
      setModel('V4_5');
    } else if (newProvider === 'mureka') {
      setModel('mureka-v6');
    } else {
      setModel('test');
    }
  };

  if (currentJob) {
    return (
      <GenerationProgress 
        job={currentJob}
        onReset={resetGeneration}
        onRetry={currentJob.status === 'failed' ? handleGenerate : undefined}
        statusText={getGenerationStatusText(currentJob)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-primary to-purple-600">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">AI Music Studio</h1>
          <AudioVisualizer isPlaying={isGenerating} barCount={5} className="h-6" />
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Создавайте профессиональную музыку с помощью искусственного интеллекта
        </p>
      </motion.div>

      {/* Mode Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            <Button
              variant={mode === 'simple' ? 'default' : 'outline'}
              onClick={() => setMode('simple')}
              className="flex items-center gap-2 text-sm sm:text-base"
              size="sm"
            >
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Простой режим</span>
              <span className="sm:hidden">Простой</span>
            </Button>
            <Button
              variant={mode === 'advanced' ? 'default' : 'outline'}
              onClick={() => setMode('advanced')}
              className="flex items-center gap-2 text-sm sm:text-base"
              size="sm"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Продвинутый режим</span>
              <span className="sm:hidden">Продвинутый</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Studio Interface */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Создание композиции
            <Badge variant="secondary">{mode === 'simple' ? 'Простой' : 'Продвинутый'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label className="text-base font-medium">Описание трека</Label>
              <div className="flex gap-1 sm:gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateAIPrompt}
                  disabled={isGeneratingPrompt}
                  className="text-xs sm:text-sm"
                >
                  <Brain className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isGeneratingPrompt ? 'animate-pulse' : ''}`} />
                  <span className="hidden sm:inline">{isGeneratingPrompt ? 'Генерирую...' : 'ИИ Промпт'}</span>
                  <span className="sm:hidden">ИИ</span>
                </Button>
                {mode === 'simple' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateRandomPrompt}
                    className="text-xs sm:text-sm"
                  >
                    <Shuffle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Случайный</span>
                    <span className="sm:hidden">Случ</span>
                  </Button>
                )}
                {mode === 'advanced' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-xs sm:text-sm"
                  >
                    <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Идеи</span>
                    <span className="sm:hidden">💡</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enhancePrompt}
                  disabled={isEnhancing}
                  className="text-xs sm:text-sm"
                >
                  <Zap className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isEnhancing ? 'animate-pulse' : ''}`} />
                  {isEnhancing ? 'Улучшаю...' : 'Улучшить ИИ'}
                </Button>
              </div>
            </div>
            
            <Textarea
              placeholder="Опишите музыку, которую хотите создать..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={mode === 'simple' ? 2 : 3}
              className="resize-none text-sm sm:text-base"
            />

            {/* Simple mode suggestions */}
            {mode === 'simple' && showSuggestions && (
              <div className="grid gap-2 mt-2">
                {simpleSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setPrompt(suggestion)}
                    className="text-left p-2 rounded border hover:border-primary/50 transition-colors text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Provider */}
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
                </SelectContent>
              </Select>
            </div>

            {/* Style */}
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
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Длительность: {duration[0]} сек</Label>
              <Slider
                value={duration}
                onValueChange={setDuration}
                max={mode === 'simple' ? 180 : 300}
                min={30}
                step={15}
                className="w-full"
              />
            </div>
          </div>

          {/* Advanced Settings */}
          {mode === 'advanced' && (
            <div className="space-y-6 pt-4 border-t">
              {/* Mood */}
              <div className="space-y-2">
                <Label>Настроение</Label>
                <Select value={mood} onValueChange={setMood}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {moodOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label>Энергетика: {energy[0]}%</Label>
                  <Slider
                    value={energy}
                    onValueChange={setEnergy}
                    max={100}
                    min={0}
                    step={10}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Темп: {tempo[0]} BPM</Label>
                  <Slider
                    value={tempo}
                    onValueChange={setTempo}
                    max={200}
                    min={60}
                    step={5}
                  />
                </div>
              </div>

              {/* Instruments */}
              <div className="space-y-3">
                <Label>Инструменты</Label>
                <div className="flex flex-wrap gap-2">
                  {instrumentOptions.map(instrument => {
                    const Icon = instrument.icon;
                    const isSelected = instruments.includes(instrument.value);
                    
                    return (
                      <Button
                        key={instrument.value}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleInstrument(instrument.value)}
                        className="flex items-center gap-1"
                      >
                        <Icon className="h-3 w-3" />
                        {instrument.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="instrumental"
                  checked={instrumental}
                  onCheckedChange={setInstrumental}
                />
                <Label htmlFor="instrumental">Инструментал</Label>
              </div>
              
              {!instrumental && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateLyrics}
                  disabled={isGeneratingLyrics}
                >
                  <FileText className={`h-4 w-4 mr-1 ${isGeneratingLyrics ? 'animate-pulse' : ''}`} />
                  {isGeneratingLyrics ? 'Генерация...' : 'Создать лирику'}
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                size="lg"
                className="min-w-32"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Создаю...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Создать трек
                  </>
                )}
              </Button>
              
              <Button
                onClick={async () => {
                  try {
                    toast({
                      title: "🧹 Очистка...",
                      description: "Очищаем зависшие задачи"
                    });
                    
                    const response = await supabase.functions.invoke('cleanup-stuck-tasks');
                    
                    if (response.error) {
                      throw new Error(response.error.message);
                    }
                    
                    toast({
                      title: "✅ Готово",
                      description: `Очищено: ${response.data?.totalCleaned || 0} задач`
                    });
                  } catch (error) {
                    toast({
                      title: "❌ Ошибка",
                      description: error.message,
                      variant: "destructive"
                    });
                  }
                }}
                variant="outline"
                size="lg"
                disabled={isGenerating}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lyrics Display */}
          {lyrics && !instrumental && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Лирика</Label>
              <Textarea
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={6}
                className="resize-none"
                placeholder="Лирика появится здесь..."
              />
            </div>
          )}

          {/* Model Selector */}
          <ModelSelector
            provider={provider}
            value={model}
            onChange={setModel}
          />
        </CardContent>
      </Card>
    </div>
  );
}