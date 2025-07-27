/**
 * Advanced Music Studio Component
 * 
 * Продвинутый интерфейс для создания музыки с расширенными возможностями:
 * - Продвинутые настройки генерации
 * - Пошаговый процесс создания
 * - Интеграция с AI для улучшения промптов
 * - Управление вариациями
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wand2, Sparkles, Music, Settings, Brain, Mic, Guitar, Piano, Drum, 
  Volume2, Layers, Clock, Zap, Heart, Target, FileMusic, Shuffle,
  ChevronRight, ChevronLeft, Save, Download, Play, Upload
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useMusicGeneration, GenerationRequest } from '@/hooks/useMusicGeneration';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ModelSelector, { ModelType } from '@/components/ui/model-selector';
import GenerationProgress from '../GenerationProgress';

interface AdvancedSettings {
  creativity: number;
  coherence: number;
  variability: number;
  structure: 'verse-chorus' | 'instrumental' | 'experimental';
  arrangement: 'minimal' | 'rich' | 'orchestral';
  mixingStyle: 'modern' | 'vintage' | 'lo-fi' | 'studio';
}

const STEP_TITLES = [
  'Концепция',
  'Стиль и настроение', 
  'Инструменты',
  'Структура',
  'Генерация'
];

export default function MusicStudioAdvanced() {
  // Core generation state
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'mureka' | 'suno' | 'test'>('suno');
  const [model, setModel] = useState<ModelType>('V4_5');
  const [instrumental, setInstrumental] = useState(false);
  const [lyrics, setLyrics] = useState('');
  
  // Advanced settings
  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    creativity: 70,
    coherence: 80,
    variability: 50,
    structure: 'verse-chorus',
    arrangement: 'rich',
    mixingStyle: 'modern'
  });

  // Style and mood
  const [genre, setGenre] = useState('pop');
  const [subGenre, setSubGenre] = useState('');
  const [mood, setMood] = useState('neutral');
  const [energy, setEnergy] = useState([65]);
  const [tempo, setTempo] = useState([120]);
  const [key, setKey] = useState('C');
  
  // Instruments and arrangement
  const [primaryInstruments, setPrimaryInstruments] = useState<string[]>([]);
  const [secondaryInstruments, setSecondaryInstruments] = useState<string[]>([]);
  const [vocalStyle, setVocalStyle] = useState('mixed');
  
  // Track structure
  const [duration, setDuration] = useState([180]);
  const [trackStructure, setTrackStructure] = useState({
    intro: true,
    verse: true,
    chorus: true,
    bridge: false,
    outro: true
  });

  // UI state
  const [currentStep, setCurrentStep] = useState(0);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  
  const { user } = useAuth();
  const { generateMusic, resetGeneration, isGenerating, currentJob } = useMusicGeneration();
  const { toast } = useToast();

  // Style options
  const genreOptions = [
    { value: 'pop', label: 'Поп', subGenres: ['synth-pop', 'indie-pop', 'electro-pop'] },
    { value: 'rock', label: 'Рок', subGenres: ['indie-rock', 'alt-rock', 'prog-rock'] },
    { value: 'electronic', label: 'Электронная', subGenres: ['house', 'techno', 'ambient', 'synthwave'] },
    { value: 'jazz', label: 'Джаз', subGenres: ['smooth-jazz', 'fusion', 'bebop'] },
    { value: 'classical', label: 'Классическая', subGenres: ['romantic', 'baroque', 'contemporary'] },
    { value: 'hip-hop', label: 'Хип-хоп', subGenres: ['trap', 'lo-fi-hip-hop', 'boom-bap'] },
    { value: 'r&b', label: 'R&B', subGenres: ['neo-soul', 'contemporary-r&b'] },
    { value: 'folk', label: 'Фолк', subGenres: ['indie-folk', 'acoustic'] }
  ];

  const moodOptions = [
    { value: 'energetic', label: 'Энергичное', icon: '⚡', color: 'text-yellow-600' },
    { value: 'calm', label: 'Спокойное', icon: '🧘', color: 'text-blue-600' },
    { value: 'melancholic', label: 'Меланхоличное', icon: '😔', color: 'text-gray-600' },
    { value: 'happy', label: 'Радостное', icon: '😊', color: 'text-green-600' },
    { value: 'mysterious', label: 'Мистическое', icon: '🔮', color: 'text-purple-600' },
    { value: 'romantic', label: 'Романтичное', icon: '💕', color: 'text-pink-600' },
    { value: 'epic', label: 'Эпичное', icon: '🏰', color: 'text-orange-600' },
    { value: 'dreamy', label: 'Мечтательное', icon: '☁️', color: 'text-indigo-600' }
  ];

  const instrumentOptions = [
    { value: 'piano', label: 'Фортепиано', icon: Piano, category: 'keyboard' },
    { value: 'guitar', label: 'Гитара', icon: Guitar, category: 'strings' },
    { value: 'bass', label: 'Бас-гитара', icon: Music, category: 'strings' },
    { value: 'drums', label: 'Барабаны', icon: Drum, category: 'percussion' },
    { value: 'vocals', label: 'Вокал', icon: Mic, category: 'vocals' },
    { value: 'synth', label: 'Синтезатор', icon: Volume2, category: 'electronic' },
    { value: 'strings', label: 'Струнные', icon: Music, category: 'orchestral' },
    { value: 'brass', label: 'Духовые', icon: Music, category: 'orchestral' },
    { value: 'organ', label: 'Орган', icon: Piano, category: 'keyboard' },
    { value: 'saxophone', label: 'Саксофон', icon: Music, category: 'wind' }
  ];

  // AI prompt enhancement
  const enhancePrompt = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите описание для улучшения",
        variant: "destructive"
      });
      return;
    }

    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke('prompt-enhancer', {
        body: {
          prompt: prompt.trim(),
          style: genre,
          mood,
          instruments: primaryInstruments.concat(secondaryInstruments),
          structure: advancedSettings.structure,
          language: 'russian'
        }
      });

      if (error) throw error;
      
      setEnhancedPrompt(data.enhancedPrompt);
      toast({
        title: "Промпт улучшен!",
        description: "ИИ создал более детальное описание"
      });
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось улучшить промпт",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Build detailed generation request
  const buildGenerationRequest = (): GenerationRequest => {
    const finalPrompt = enhancedPrompt || prompt;
    const styleDetails = [
      genre,
      subGenre && `${subGenre}`,
      `${mood} mood`,
      `${energy[0]}% energy`,
      `${tempo[0]} BPM`,
      advancedSettings.arrangement !== 'minimal' && `${advancedSettings.arrangement} arrangement`,
      advancedSettings.mixingStyle !== 'modern' && `${advancedSettings.mixingStyle} mixing`
    ].filter(Boolean).join(', ');

    const instrumentDescription = [
      primaryInstruments.length > 0 && `primary: ${primaryInstruments.join(', ')}`,
      secondaryInstruments.length > 0 && `secondary: ${secondaryInstruments.join(', ')}`
    ].filter(Boolean).join('; ');

    const enhancedDescription = [
      finalPrompt,
      `Style: ${styleDetails}`,
      instrumentDescription && `Instruments: ${instrumentDescription}`,
      !instrumental && lyrics && `Custom lyrics provided`,
      `Duration: ${Math.floor(duration[0] / 60)}:${(duration[0] % 60).toString().padStart(2, '0')}`
    ].filter(Boolean).join('. ');

    return {
      prompt: enhancedDescription,
      provider,
      model,
      style: genre,
      instrumental,
      lyrics: instrumental ? undefined : lyrics,
      duration: duration[0]
    };
  };

  // Handle generation
  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в систему для генерации музыки",
        variant: "destructive"
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите описание композиции",
        variant: "destructive"
      });
      return;
    }

    try {
      const request = buildGenerationRequest();
      await generateMusic(request);
      
      toast({
        title: "Генерация начата!",
        description: "Создание уникальной композиции..."
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Ошибка генерации",
        description: "Попробуйте еще раз или измените параметры",
        variant: "destructive"
      });
    }
  };

  // Step navigation
  const nextStep = () => {
    if (currentStep < STEP_TITLES.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Toggle instrument selection
  const toggleInstrument = (instrument: string, isPrimary: boolean) => {
    if (isPrimary) {
      setPrimaryInstruments(prev => 
        prev.includes(instrument) 
          ? prev.filter(i => i !== instrument)
          : [...prev, instrument]
      );
    } else {
      setSecondaryInstruments(prev => 
        prev.includes(instrument) 
          ? prev.filter(i => i !== instrument)
          : [...prev, instrument]
      );
    }
  };

  // Show generation progress if active
  if (currentJob && isGenerating) {
    return (
      <div className="space-y-6">
        <GenerationProgress 
          job={currentJob} 
          onReset={resetGeneration}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Продвинутая студия</h2>
        </div>
        <p className="text-muted-foreground">
          Создайте профессиональную композицию с полным контролем над процессом
        </p>
      </div>

      {/* Progress indicator */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Шаг {currentStep + 1} из {STEP_TITLES.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(((currentStep + 1) / STEP_TITLES.length) * 100)}%
            </span>
          </div>
          <Progress value={((currentStep + 1) / STEP_TITLES.length) * 100} className="h-2" />
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEP_TITLES.map((title, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`text-xs text-center max-w-[80px] ${
                  index <= currentStep 
                    ? 'text-primary font-medium' 
                    : 'text-muted-foreground'
                }`}
              >
                <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs ${
                  index <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                {title}
              </button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {currentStep === 0 && <FileMusic className="h-5 w-5" />}
                {currentStep === 1 && <Heart className="h-5 w-5" />}
                {currentStep === 2 && <Music className="h-5 w-5" />}
                {currentStep === 3 && <Layers className="h-5 w-5" />}
                {currentStep === 4 && <Sparkles className="h-5 w-5" />}
                {STEP_TITLES[currentStep]}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Step 0: Concept */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="prompt">Описание композиции</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Опишите какую музыку вы хотите создать. Будьте креативны и детальны..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] mt-2"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={enhancePrompt}
                      disabled={isEnhancing || !prompt.trim()}
                      variant="outline"
                      className="flex-1"
                    >
                      <Brain className={`h-4 w-4 mr-2 ${isEnhancing ? 'animate-pulse' : ''}`} />
                      {isEnhancing ? 'Улучшаю...' : 'Улучшить с ИИ'}
                    </Button>
                  </div>

                  {enhancedPrompt && (
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <Label className="text-sm font-medium">Улучшенное описание:</Label>
                      <p className="text-sm mt-2">{enhancedPrompt}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Провайдер</Label>
                      <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="suno">Suno AI</SelectItem>
                          <SelectItem value="mureka">Mureka</SelectItem>
                          <SelectItem value="test">Тестовый</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Модель</Label>
                      <div className="mt-2">
                        <ModelSelector
                          provider={provider}
                          value={model}
                          onChange={setModel}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: Style & Mood */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Жанр</Label>
                      <Select value={genre} onValueChange={setGenre}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {genreOptions.map(g => (
                            <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Поджанр</Label>
                      <Select value={subGenre} onValueChange={setSubGenre}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Выберите поджанр" />
                        </SelectTrigger>
                        <SelectContent>
                          {genreOptions
                            .find(g => g.value === genre)?.subGenres
                            .map(sg => (
                              <SelectItem key={sg} value={sg}>{sg}</SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Настроение</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {moodOptions.map(m => (
                        <button
                          key={m.value}
                          onClick={() => setMood(m.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            mood === m.value 
                              ? 'border-primary bg-primary/10' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{m.icon}</div>
                          <div className={`text-xs font-medium ${m.color}`}>{m.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Энергичность: {energy[0]}%</Label>
                      <Slider
                        value={energy}
                        onValueChange={setEnergy}
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Темп: {tempo[0]} BPM</Label>
                      <Slider
                        value={tempo}
                        onValueChange={setTempo}
                        min={60}
                        max={200}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Instruments */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Switch
                      checked={instrumental}
                      onCheckedChange={setInstrumental}
                    />
                    <Label>Инструментальная композиция</Label>
                  </div>

                  {!instrumental && (
                    <div>
                      <Label>Стиль вокала</Label>
                      <Select value={vocalStyle} onValueChange={setVocalStyle}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mixed">Смешанный</SelectItem>
                          <SelectItem value="male">Мужской</SelectItem>
                          <SelectItem value="female">Женский</SelectItem>
                          <SelectItem value="choir">Хор</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label className="mb-3 block">Основные инструменты</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {instrumentOptions.map(inst => {
                        const Icon = inst.icon;
                        const isSelected = primaryInstruments.includes(inst.value);
                        return (
                          <button
                            key={inst.value}
                            onClick={() => toggleInstrument(inst.value, true)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/10' 
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <Icon className="h-6 w-6 mx-auto mb-2" />
                            <div className="text-xs font-medium">{inst.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-3 block">Дополнительные инструменты</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {instrumentOptions.map(inst => {
                        const Icon = inst.icon;
                        const isSelected = secondaryInstruments.includes(inst.value);
                        const isPrimary = primaryInstruments.includes(inst.value);
                        return (
                          <button
                            key={inst.value}
                            onClick={() => toggleInstrument(inst.value, false)}
                            disabled={isPrimary}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              isPrimary 
                                ? 'border-muted bg-muted/50 opacity-50 cursor-not-allowed'
                                : isSelected 
                                  ? 'border-secondary bg-secondary/10' 
                                  : 'border-border hover:border-secondary/50'
                            }`}
                          >
                            <Icon className="h-6 w-6 mx-auto mb-2" />
                            <div className="text-xs font-medium">{inst.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Structure */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label>Длительность: {Math.floor(duration[0] / 60)}:{(duration[0] % 60).toString().padStart(2, '0')}</Label>
                    <Slider
                      value={duration}
                      onValueChange={setDuration}
                      min={30}
                      max={300}
                      step={15}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Структура</Label>
                      <Select 
                        value={advancedSettings.structure} 
                        onValueChange={(value: any) => 
                          setAdvancedSettings(prev => ({ ...prev, structure: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="verse-chorus">Куплет-Припев</SelectItem>
                          <SelectItem value="instrumental">Инструментальная</SelectItem>
                          <SelectItem value="experimental">Экспериментальная</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Аранжировка</Label>
                      <Select 
                        value={advancedSettings.arrangement} 
                        onValueChange={(value: any) => 
                          setAdvancedSettings(prev => ({ ...prev, arrangement: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="minimal">Минимальная</SelectItem>
                          <SelectItem value="rich">Богатая</SelectItem>
                          <SelectItem value="orchestral">Оркестровая</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Стиль микса</Label>
                      <Select 
                        value={advancedSettings.mixingStyle} 
                        onValueChange={(value: any) => 
                          setAdvancedSettings(prev => ({ ...prev, mixingStyle: value }))
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Современный</SelectItem>
                          <SelectItem value="vintage">Винтажный</SelectItem>
                          <SelectItem value="lo-fi">Lo-Fi</SelectItem>
                          <SelectItem value="studio">Студийный</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label>Креативность: {advancedSettings.creativity}%</Label>
                      <Slider
                        value={[advancedSettings.creativity]}
                        onValueChange={([value]) => 
                          setAdvancedSettings(prev => ({ ...prev, creativity: value }))
                        }
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    
                    <div>
                      <Label>Связность: {advancedSettings.coherence}%</Label>
                      <Slider
                        value={[advancedSettings.coherence]}
                        onValueChange={([value]) => 
                          setAdvancedSettings(prev => ({ ...prev, coherence: value }))
                        }
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Вариативность: {advancedSettings.variability}%</Label>
                      <Slider
                        value={[advancedSettings.variability]}
                        onValueChange={([value]) => 
                          setAdvancedSettings(prev => ({ ...prev, variability: value }))
                        }
                        max={100}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {!instrumental && (
                    <div>
                      <Label htmlFor="lyrics">Текст песни (опционально)</Label>
                      <Textarea
                        id="lyrics"
                        placeholder="Введите текст песни или оставьте пустым для автоматической генерации..."
                        value={lyrics}
                        onChange={(e) => setLyrics(e.target.value)}
                        className="min-h-[100px] mt-2"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Generation */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Готово к генерации!</h3>
                    <p className="text-muted-foreground">
                      Проверьте настройки и нажмите кнопку для создания уникальной композиции
                    </p>
                  </div>

                  {/* Generation summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Основные параметры</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Жанр:</span>
                          <span className="font-medium">{genreOptions.find(g => g.value === genre)?.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Настроение:</span>
                          <span className="font-medium">{moodOptions.find(m => m.value === mood)?.label}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Длительность:</span>
                          <span className="font-medium">{Math.floor(duration[0] / 60)}:{(duration[0] % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Темп:</span>
                          <span className="font-medium">{tempo[0]} BPM</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Инструменты</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {primaryInstruments.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Основные:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {primaryInstruments.map(inst => (
                                <Badge key={inst} variant="default" className="text-xs">
                                  {instrumentOptions.find(i => i.value === inst)?.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {secondaryInstruments.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Дополнительные:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {secondaryInstruments.map(inst => (
                                <Badge key={inst} variant="secondary" className="text-xs">
                                  {instrumentOptions.find(i => i.value === inst)?.label}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {!instrumental && (
                          <div className="flex justify-between">
                            <span>Вокал:</span>
                            <span className="font-medium">{vocalStyle}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center">
                    <Button 
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      size="lg"
                      className="px-8"
                    >
                      <Sparkles className="h-5 w-5 mr-2" />
                      Создать композицию
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={prevStep}
          disabled={currentStep === 0}
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>

        <div className="flex gap-2">
          {currentStep < STEP_TITLES.length - 1 && (
            <Button onClick={nextStep}>
              Далее
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}