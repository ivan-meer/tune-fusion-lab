import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  Play, 
  Wand2, 
  Mic, 
  Volume2, 
  FileAudio,
  Loader2,
  Music2,
  Brain
} from 'lucide-react'

export const PipelineFragments: React.FC = () => {
  const [selectedTrackId, setSelectedTrackId] = useState('')
  const [audioId, setAudioId] = useState('')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  
  // Параметры для расширения
  const [extendAt, setExtendAt] = useState([30])
  const [extendPrompt, setExtendPrompt] = useState('Продолжить с финальным припевом')
  const [extendModel, setExtendModel] = useState('V4_5')
  
  // Параметры для улучшения стиля
  const [styleContent, setStyleContent] = useState('')
  
  const { toast } = useToast()

  const handleStyleEnhancement = async () => {
    if (!styleContent.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите описание стиля для улучшения",
        variant: "destructive"
      })
      return
    }

    setIsLoading('style')
    
    try {
      const response = await supabase.functions.invoke('style-enhance', {
        body: { content: styleContent }
      })

      if (response.error) {
        throw response.error
      }

      toast({
        title: "Стиль улучшен",
        description: "Описание стиля успешно обработано"
      })

      console.log('Enhanced style:', response.data)
      
    } catch (error) {
      console.error('Style enhancement error:', error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось улучшить стиль",
        variant: "destructive"
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleTrackExtension = async () => {
    if (!audioId.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите ID аудио для расширения",
        variant: "destructive"
      })
      return
    }

    setIsLoading('extend')
    
    try {
      const response = await supabase.functions.invoke('extend-music', {
        body: {
          audioId,
          continueAt: extendAt[0],
          prompt: extendPrompt,
          model: extendModel
        }
      })

      if (response.error) {
        throw response.error
      }

      toast({
        title: "Расширение начато",
        description: `Трек расширяется с позиции ${extendAt[0]} секунд`
      })

      console.log('Extension result:', response.data)
      
    } catch (error) {
      console.error('Track extension error:', error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось расширить трек",
        variant: "destructive"
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleVocalRemoval = async () => {
    if (!selectedTrackId || !audioId) {
      toast({
        title: "Ошибка",
        description: "Укажите ID трека и аудио для разделения вокала",
        variant: "destructive"
      })
      return
    }

    setIsLoading('vocal')
    
    try {
      const response = await supabase.functions.invoke('vocal-removal', {
        body: {
          taskId: selectedTrackId,
          audioId
        }
      })

      if (response.error) {
        throw response.error
      }

      toast({
        title: "Разделение вокала начато",
        description: "Создается инструментальная версия трека"
      })

      console.log('Vocal removal result:', response.data)
      
    } catch (error) {
      console.error('Vocal removal error:', error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось начать разделение вокала",
        variant: "destructive"
      })
    } finally {
      setIsLoading(null)
    }
  }

  const handleWavConversion = async () => {
    if (!selectedTrackId || !audioId) {
      toast({
        title: "Ошибка",
        description: "Укажите ID трека и аудио для конвертации",
        variant: "destructive"
      })
      return
    }

    setIsLoading('wav')
    
    try {
      const response = await supabase.functions.invoke('wav-conversion', {
        body: {
          taskId: selectedTrackId,
          audioId
        }
      })

      if (response.error) {
        throw response.error
      }

      toast({
        title: "Конвертация в WAV начата",
        description: "Создается высококачественная версия трека"
      })

      console.log('WAV conversion result:', response.data)
      
    } catch (error) {
      console.error('WAV conversion error:', error)
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось начать конвертацию в WAV",
        variant: "destructive"
      })
    } finally {
      setIsLoading(null)
    }
  }

  const generateAIStylePrompt = async () => {
    setIsLoading('ai-style')
    
    try {
      const response = await supabase.functions.invoke('ai-prompt-generator', {
        body: { 
          type: 'style', 
          context: styleContent || 'современная музыка'
        }
      })

      if (response.data?.success && response.data.prompt) {
        setStyleContent(response.data.prompt)
        toast({
          title: "Промпт сгенерирован!",
          description: "ИИ создал улучшенное описание стиля"
        })
      } else {
        throw new Error(response.data?.error || 'AI generation failed')
      }
    } catch (error) {
      console.error('AI style prompt error:', error)
      toast({
        title: "Ошибка генерации",
        description: "Попробуйте еще раз",
        variant: "destructive"
      })
    } finally {
      setIsLoading(null)
    }
  }

  const generateAIExtendPrompt = async () => {
    setIsLoading('ai-extend')
    
    try {
      const response = await supabase.functions.invoke('ai-prompt-generator', {
        body: { 
          type: 'extend', 
          context: extendPrompt || 'продолжение музыкального трека'
        }
      })

      if (response.data?.success && response.data.prompt) {
        setExtendPrompt(response.data.prompt)
        toast({
          title: "Промпт сгенерирован!",
          description: "ИИ создал описание для расширения трека"
        })
      } else {
        throw new Error(response.data?.error || 'AI generation failed')
      }
    } catch (error) {
      console.error('AI extend prompt error:', error)
      toast({
        title: "Ошибка генерации",
        description: "Попробуйте еще раз",
        variant: "destructive"
      })
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Улучшение стиля */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Улучшение стиля
          </CardTitle>
          <CardDescription>
            Улучшите описание стиля музыки с помощью ИИ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="style-content">Описание стиля</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={generateAIStylePrompt}
                disabled={isLoading === 'ai-style'}
              >
                <Brain className={`h-4 w-4 mr-1 ${isLoading === 'ai-style' ? 'animate-pulse' : ''}`} />
                {isLoading === 'ai-style' ? 'Генерирую...' : 'ИИ Промпт'}
              </Button>
            </div>
            <Textarea
              id="style-content"
              placeholder="Pop, энергичная музыка"
              value={styleContent}
              onChange={(e) => setStyleContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <Button 
            onClick={handleStyleEnhancement}
            disabled={isLoading === 'style' || !styleContent.trim()}
            className="w-full"
          >
            {isLoading === 'style' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Улучшаем стиль...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Улучшить стиль
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Расширение трека */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Расширение трека
          </CardTitle>
          <CardDescription>
            Увеличьте длительность существующего трека
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="audio-id">ID аудио трека</Label>
            <Input
              id="audio-id"
              placeholder="ad70c238-fcdf-4478-bffd-bc31475ec405"
              value={audioId}
              onChange={(e) => setAudioId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Продолжить с позиции (сек от конца)</Label>
            <Slider
              value={extendAt}
              onValueChange={setExtendAt}
              max={60}
              min={10}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">{extendAt[0]} секунд</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="extend-prompt">Промпт для расширения</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={generateAIExtendPrompt}
                disabled={isLoading === 'ai-extend'}
              >
                <Brain className={`h-4 w-4 mr-1 ${isLoading === 'ai-extend' ? 'animate-pulse' : ''}`} />
                {isLoading === 'ai-extend' ? 'Генерирую...' : 'ИИ Промпт'}
              </Button>
            </div>
            <Input
              id="extend-prompt"
              placeholder="Добавить финальный припев и завершение"
              value={extendPrompt}
              onChange={(e) => setExtendPrompt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extend-model">Модель</Label>
            <Select value={extendModel} onValueChange={setExtendModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="V3_5">V3.5</SelectItem>
                <SelectItem value="V4">V4</SelectItem>
                <SelectItem value="V4_5">V4.5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={handleTrackExtension}
            disabled={isLoading === 'extend' || !audioId.trim()}
            className="w-full"
          >
            {isLoading === 'extend' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Расширяем трек...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Расширить трек
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Разделение вокала */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Разделение вокала
          </CardTitle>
          <CardDescription>
            Создайте инструментальную версию трека
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="track-id-vocal">ID задачи генерации</Label>
            <Input
              id="track-id-vocal"
              placeholder="57d2ff56a94b5728c37cdfd3c0f77ea8"
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio-id-vocal">ID аудио трека</Label>
            <Input
              id="audio-id-vocal"
              placeholder="ad70c238-fcdf-4478-bffd-bc31475ec405"
              value={audioId}
              onChange={(e) => setAudioId(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleVocalRemoval}
            disabled={isLoading === 'vocal' || !selectedTrackId || !audioId}
            className="w-full"
          >
            {isLoading === 'vocal' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Разделяем вокал...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Разделить вокал
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Конвертация в WAV */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileAudio className="h-5 w-5" />
            Конвертация в WAV
          </CardTitle>
          <CardDescription>
            Конвертируйте трек в высококачественный WAV формат
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="track-id-wav">ID задачи генерации</Label>
            <Input
              id="track-id-wav"
              placeholder="57d2ff56a94b5728c37cdfd3c0f77ea8"
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio-id-wav">ID аудио трека</Label>
            <Input
              id="audio-id-wav"
              placeholder="ad70c238-fcdf-4478-bffd-bc31475ec405"
              value={audioId}
              onChange={(e) => setAudioId(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={handleWavConversion}
            disabled={isLoading === 'wav' || !selectedTrackId || !audioId}
            className="w-full"
          >
            {isLoading === 'wav' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Конвертируем в WAV...
              </>
            ) : (
              <>
                <FileAudio className="mr-2 h-4 w-4" />
                Конвертировать в WAV
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}