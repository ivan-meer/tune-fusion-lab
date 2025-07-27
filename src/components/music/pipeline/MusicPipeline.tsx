import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  Play, 
  Settings, 
  Wand2, 
  Music, 
  Mic, 
  Volume2, 
  FileAudio,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface PipelineStep {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  icon: React.ComponentType<{ className?: string }>
}

interface PipelineStatus {
  pipelineId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  currentStep: number
  steps: PipelineStep[]
  totalProgress: number
  estimatedTimeRemaining: number
}

const defaultSteps: PipelineStep[] = [
  { name: 'Генерация базового трека', status: 'pending', progress: 0, icon: Music },
  { name: 'Улучшение стиля', status: 'pending', progress: 0, icon: Wand2 },
  { name: 'Расширение трека', status: 'pending', progress: 0, icon: Play },
  { name: 'Разделение вокала', status: 'pending', progress: 0, icon: Mic },
  { name: 'Конвертация в WAV', status: 'pending', progress: 0, icon: FileAudio }
]

export const MusicPipeline: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('pop')
  const [title, setTitle] = useState('')
  const [model, setModel] = useState('V4_5')
  
  // Настройки пайплайна
  const [enableExtension, setEnableExtension] = useState(true)
  const [enableVocalSeparation, setEnableVocalSeparation] = useState(false)
  const [enableWavConversion, setEnableWavConversion] = useState(false)
  const [extendAt, setExtendAt] = useState([30])
  const [extendPrompt, setExtendPrompt] = useState('Продолжить с финальным припевом')
  
  // Состояние пайплайна
  const [isRunning, setIsRunning] = useState(false)
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null)
  
  const { toast } = useToast()

  const startPipeline = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите описание для генерации музыки",
        variant: "destructive"
      })
      return
    }

    setIsRunning(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Требуется авторизация')
      }

      const response = await supabase.functions.invoke('music-pipeline', {
        body: {
          prompt,
          style,
          title: title || prompt.slice(0, 50),
          model,
          enableExtension,
          enableVocalSeparation,
          enableWavConversion,
          extendAt: extendAt[0],
          extendPrompt
        }
      })

      if (response.error) {
        throw response.error
      }

      const { pipelineId, steps } = response.data
      
      setPipelineStatus({
        pipelineId,
        status: 'processing',
        currentStep: 0,
        steps: steps.map((step: any, index: number) => ({
          ...defaultSteps[index],
          ...step
        })),
        totalProgress: 0,
        estimatedTimeRemaining: 300
      })

      toast({
        title: "Пайплайн запущен",
        description: "Генерация полного трека начата"
      })

      // Начинаем мониторинг статуса
      pollPipelineStatus(pipelineId)
      
    } catch (error) {
      console.error('Pipeline start error:', error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось запустить пайплайн",
        variant: "destructive"
      })
      setIsRunning(false)
    }
  }

  const pollPipelineStatus = async (pipelineId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await supabase.functions.invoke('pipeline-status', {
          body: { pipelineId }
        })

        if (response.data?.pipeline) {
          const status = response.data.pipeline
          setPipelineStatus(status)

          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(interval)
            setIsRunning(false)
            
            toast({
              title: status.status === 'completed' ? "Пайплайн завершен" : "Пайплайн провален",
              description: status.status === 'completed' 
                ? "Все этапы генерации выполнены успешно"
                : "Произошла ошибка при выполнении пайплайна",
              variant: status.status === 'completed' ? "default" : "destructive"
            })
          }
        }
      } catch (error) {
        console.error('Status poll error:', error)
      }
    }, 3000)

    // Останавливаем опрос через 10 минут
    setTimeout(() => {
      clearInterval(interval)
      setIsRunning(false)
    }, 600000)
  }

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'processing':
        return 'bg-blue-500'
      case 'failed':
        return 'bg-red-500'
      default:
        return 'bg-gray-300'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Полный пайплайн генерации музыки
          </CardTitle>
          <CardDescription>
            Создайте профессиональный трек с расширенными возможностями обработки
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Основные параметры */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Описание трека</Label>
              <Textarea
                id="prompt"
                placeholder="Энергичная рок-песня о преодолении трудностей..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="style">Стиль</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="electronic">Electronic</SelectItem>
                    <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                    <SelectItem value="classical">Classical</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="reggae">Reggae</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Название (опционально)</Label>
                <Input
                  id="title"
                  placeholder="Автоматически из описания"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Модель</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="V3_5">V3.5 (Быстрая)</SelectItem>
                    <SelectItem value="V4">V4 (Качественная)</SelectItem>
                    <SelectItem value="V4_5">V4.5 (Продвинутая)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Настройки этапов пайплайна */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Этапы обработки</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Расширение трека</Label>
                    <p className="text-xs text-muted-foreground">
                      Увеличить длительность композиции
                    </p>
                  </div>
                  <Switch
                    checked={enableExtension}
                    onCheckedChange={setEnableExtension}
                  />
                </div>

                {enableExtension && (
                  <div className="space-y-3 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label className="text-xs">Продолжить с позиции (сек от конца)</Label>
                      <Slider
                        value={extendAt}
                        onValueChange={setExtendAt}
                        max={60}
                        min={10}
                        step={5}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">{extendAt[0]} секунд</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Промпт для расширения</Label>
                      <Input
                        placeholder="Добавить финальный припев..."
                        value={extendPrompt}
                        onChange={(e) => setExtendPrompt(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Разделение вокала</Label>
                    <p className="text-xs text-muted-foreground">
                      Создать инструментальную версию
                    </p>
                  </div>
                  <Switch
                    checked={enableVocalSeparation}
                    onCheckedChange={setEnableVocalSeparation}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">Конвертация в WAV</Label>
                    <p className="text-xs text-muted-foreground">
                      Высококачественный аудиоформат
                    </p>
                  </div>
                  <Switch
                    checked={enableWavConversion}
                    onCheckedChange={setEnableWavConversion}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Кнопка запуска */}
          <Button 
            onClick={startPipeline} 
            disabled={isRunning || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Выполняется пайплайн...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Запустить полный пайплайн
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Статус пайплайна */}
      {pipelineStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Статус пайплайна</span>
              <Badge variant={
                pipelineStatus.status === 'completed' ? 'default' :
                pipelineStatus.status === 'failed' ? 'destructive' : 'secondary'
              }>
                {pipelineStatus.status === 'processing' ? 'Выполняется' :
                 pipelineStatus.status === 'completed' ? 'Завершен' :
                 pipelineStatus.status === 'failed' ? 'Ошибка' : 'Ожидание'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Общий прогресс: {pipelineStatus.totalProgress}%
              {pipelineStatus.estimatedTimeRemaining > 0 && (
                <span className="ml-2">
                  • Осталось ~{Math.ceil(pipelineStatus.estimatedTimeRemaining / 60)} мин
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={pipelineStatus.totalProgress} className="w-full" />
              
              <div className="space-y-3">
                {pipelineStatus.steps.map((step, index) => {
                  const IconComponent = step.icon
                  return (
                    <div key={step.name} className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {getStepStatusIcon(step.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{step.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {step.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full transition-all duration-300 ${getStepStatusColor(step.status)}`}
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}