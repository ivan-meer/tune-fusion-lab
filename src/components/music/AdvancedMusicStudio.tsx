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
import { useAuth } from '@/components/auth/AuthProvider';
import { useMusicGeneration, GenerationRequest } from '@/hooks/useMusicGeneration';
import ModelSelector, { ModelType } from '@/components/ui/model-selector';
import GenerationProgress from './GenerationProgress';
import { useToast } from '@/hooks/use-toast';
import { 
  Wand2, Sparkles, Music, Shuffle, Zap, Volume2, Brain, 
  Mic, Guitar, Piano, Drum, Waves, Settings, Play,
  ChevronDown, ChevronUp, Lightbulb
} from 'lucide-react';

const AdvancedMusicStudio = () => {
  // Core state
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'mureka' | 'suno' | 'test'>('suno');
  const [model, setModel] = useState<ModelType>('V4_5');
  const [style, setStyle] = useState('pop');
  const [duration, setDuration] = useState([120]);
  const [instrumental, setInstrumental] = useState(false);
  const [lyrics, setLyrics] = useState('');

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [energy, setEnergy] = useState([50]);
  const [mood, setMood] = useState('neutral');
  const [tempo, setTempo] = useState([120]);
  const [complexity, setComplexity] = useState([50]);
  const [vocals, setVocals] = useState('mixed');
  const [instruments, setInstruments] = useState<string[]>([]);

  // UI state
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { user } = useAuth();
  const { generateMusic, resetGeneration, isGenerating, currentJob } = useMusicGeneration();
  const { toast } = useToast();

  // Enhanced prompt suggestions
  const promptTemplates = {
    pop: [
      "Яркая летняя поп-песня с запоминающимся припевом и энергичными синтезаторами",
      "Романтическая баллада с нежным женским вокалом и акустической гитарой",
      "Танцевальный поп-трек с пульсирующим басом и воздушными вокальными гармониями"
    ],
    rock: [
      "Мощная рок-баллада с эмоциональными гитарными соло и драматическими барабанами",
      "Энергичный панк-рок трек с быстрыми рифами и агрессивным вокалом",
      "Прогрессивный рок с сложными аранжировками и виртуозной игрой"
    ],
    electronic: [
      "Атмосферный эмбиент-трек с плавными переходами и космическими звуками",
      "Динамичный техно с пульсирующими синтезаторами и глубоким басом",
      "Мелодичный хаус с теплыми аккордами и грувовым ритмом"
    ],
    classical: [
      "Величественная симфоническая композиция с полным оркестром",
      "Интимная фортепианная соната с выразительной мелодией",
      "Камерная музыка для струнного квартета с классическими гармониями"
    ]
  };

  const moodOptions = [
    { value: 'happy', label: 'Радостное', icon: '😊' },
    { value: 'melancholic', label: 'Меланхоличное', icon: '😢' },
    { value: 'energetic', label: 'Энергичное', icon: '⚡' },
    { value: 'calm', label: 'Спокойное', icon: '😌' },
    { value: 'mysterious', label: 'Мистическое', icon: '🔮' },
    { value: 'romantic', label: 'Романтичное', icon: '💕' },
    { value: 'epic', label: 'Эпичное', icon: '🏰' },
    { value: 'dreamy', label: 'Мечтательное', icon: '☁️' }
  ];

  const instrumentOptions = [
    { value: 'piano', label: 'Фортепиано', icon: Piano },
    { value: 'guitar', label: 'Гитара', icon: Guitar },
    { value: 'drums', label: 'Барабаны', icon: Drum },
    { value: 'synthesizer', label: 'Синтезатор', icon: Waves },
    { value: 'vocals', label: 'Вокал', icon: Mic },
    { value: 'strings', label: 'Струнные', icon: Music },
    { value: 'brass', label: 'Духовые', icon: Volume2 },
    { value: 'percussion', label: 'Перкуссия', icon: Drum }
  ];

  // Generate contextual suggestions based on current settings
  useEffect(() => {
    const generateSuggestions = () => {
      const templates = promptTemplates[style as keyof typeof promptTemplates] || promptTemplates.pop;
      const moodText = moodOptions.find(m => m.value === mood)?.label.toLowerCase() || '';
      const instrumentText = instruments.length > 0 ? instruments.join(', ') : '';
      
      const suggestions = templates.map(template => {
        let enhanced = template;
        if (moodText && moodText !== 'neutral') {
          enhanced = `${moodText} ${enhanced.toLowerCase()}`;
        }
        if (instrumentText) {
          enhanced += ` с акцентом на ${instrumentText}`;
        }
        if (energy[0] > 70) {
          enhanced += ', высокая энергетика';
        } else if (energy[0] < 30) {
          enhanced += ', спокойное звучание';
        }
        return enhanced;
      });
      
      setPromptSuggestions(suggestions);
    };

    generateSuggestions();
  }, [style, mood, energy, instruments]);

  const enhancePromptWithAI = async () => {
    if (!prompt.trim()) return;
    
    setIsEnhancing(true);
    
    // Simulate AI enhancement
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const enhancements = [
      `профессиональное студийное качество, ${style} стиль`,
      `эмоциональная глубина и динамические переходы`,
      `богатые гармонии и многослойная аранжировка`,
      `кинематографичное звучание с пространственными эффектами`,
      `современный продакшн с вниманием к деталям`
    ];
    
    const selectedEnhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
    setPrompt(prev => `${prev}, ${selectedEnhancement}`);
    setIsEnhancing(false);
    
    toast({
      title: "Промпт улучшен!",
      description: "Добавлены профессиональные детали для лучшего результата"
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user) return;

    const request: GenerationRequest = {
      prompt: buildEnhancedPrompt(),
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
    }
  };

  const buildEnhancedPrompt = () => {
    let enhancedPrompt = prompt;
    
    // Add mood and energy context
    const selectedMood = moodOptions.find(m => m.value === mood);
    if (selectedMood && mood !== 'neutral') {
      enhancedPrompt += `, ${selectedMood.label.toLowerCase()} настроение`;
    }
    
    // Add tempo information
    if (tempo[0] < 80) {
      enhancedPrompt += ', медленный темп';
    } else if (tempo[0] > 140) {
      enhancedPrompt += ', быстрый темп';
    }
    
    // Add energy level
    if (energy[0] > 70) {
      enhancedPrompt += ', высокая энергетика';
    } else if (energy[0] < 30) {
      enhancedPrompt += ', спокойное звучание';
    }
    
    // Add instrument preferences
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

  if (currentJob) {
    return (
      <GenerationProgress 
        job={currentJob}
        onReset={resetGeneration}
        onRetry={currentJob.status === 'failed' ? handleGenerate : undefined}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
          <h1 className="text-3xl font-bold gradient-text">AI Music Studio Pro</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Создайте профессиональную музыку с помощью передовых алгоритмов искусственного интеллекта. 
          Настройте каждый аспект вашего трека для получения идеального результата.
        </p>
      </motion.div>

      {/* Main Generation Card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Создание композиции
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Prompt Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Описание трека</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Идеи
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={enhancePromptWithAI}
                  disabled={isEnhancing}
                >
                  <Zap className={`h-4 w-4 mr-1 ${isEnhancing ? 'animate-pulse' : ''}`} />
                  {isEnhancing ? 'Улучшаю...' : 'Улучшить ИИ'}
                </Button>
              </div>
            </div>
            
            <Textarea
              placeholder="Опишите музыку, которую хотите создать..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />

            {/* Prompt Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label className="text-sm text-muted-foreground">Предложения на основе ваших настроек:</Label>
                  <div className="grid gap-2">
                    {promptSuggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setPrompt(suggestion)}
                        className="text-left p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <p className="text-sm">{suggestion}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Basic Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Provider & Model */}
            <div className="space-y-2">
              <Label>ИИ Провайдер</Label>
              <Select value={provider} onValueChange={(value: any) => setProvider(value)}>
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
              <Label>Музыкальный стиль</Label>
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
          </div>

          {/* Advanced Controls Toggle */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Расширенные настройки
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="instrumental"
                  checked={instrumental}
                  onCheckedChange={setInstrumental}
                />
                <Label htmlFor="instrumental">Инструментал</Label>
              </div>
            </div>
          </div>

          {/* Advanced Settings */}
          <AnimatePresence>
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6 pt-4 border-t"
              >
                {/* Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label>Длительность: {duration[0]} сек</Label>
                    <Slider
                      value={duration}
                      onValueChange={setDuration}
                      max={300}
                      min={30}
                      step={15}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Энергетика: {energy[0]}%</Label>
                    <Slider
                      value={energy}
                      onValueChange={setEnergy}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
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
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Сложность: {complexity[0]}%</Label>
                    <Slider
                      value={complexity}
                      onValueChange={setComplexity}
                      max={100}
                      min={0}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Instruments */}
                <div className="space-y-3">
                  <Label>Инструменты</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {instrumentOptions.map(instrument => {
                      const IconComponent = instrument.icon;
                      const isSelected = instruments.includes(instrument.value);
                      
                      return (
                        <Button
                          key={instrument.value}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleInstrument(instrument.value)}
                          className="flex items-center gap-2"
                        >
                          <IconComponent className="h-4 w-4" />
                          {instrument.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Lyrics */}
                {!instrumental && (
                  <div className="space-y-2">
                    <Label>Текст песни (опционально)</Label>
                    <Textarea
                      placeholder="Введите текст песни или оставьте пустым для автогенерации"
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full h-12 text-lg"
              size="lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {isGenerating ? 'Создаем музыку...' : 'Создать трек'}
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      {/* Model Selector */}
      <Card>
        <CardContent className="pt-6">
          <ModelSelector
            value={model}
            onChange={setModel}
            provider={provider}
            showDetails={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedMusicStudio;