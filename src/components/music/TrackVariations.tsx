import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrackVariations } from '@/hooks/useTrackVariations';
import { EnhancedTrack, TrackVariation } from '@/types/musicGeneration';
import { 
  Music, 
  Plus, 
  Wand2, 
  Palette, 
  FileText, 
  ArrowRight,
  GitBranch,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrackVariationsProps {
  track: EnhancedTrack;
  onCreateVariation?: (parentId: string, type: 'manual' | 'auto_improve' | 'style_change' | 'lyrics_change') => void;
}

export default function TrackVariations({ track, onCreateVariation }: TrackVariationsProps) {
  const {
    variations,
    isLoading,
    error,
    loadTrackVariations,
    createVariation,
    getChildVariations,
    getParentTrack,
    isDraftTrack
  } = useTrackVariations();

  const [isCreatingVariation, setIsCreatingVariation] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    if (track.id) {
      loadTrackVariations(track.id);
      
      // Check if this is a draft track
      isDraftTrack(track.id).then(setIsDraft);
    }
  }, [track.id, loadTrackVariations, isDraftTrack]);

  const childVariations = getChildVariations(track.id);
  const parentTrack = getParentTrack(track.id);

  const handleCreateVariation = async (type: 'manual' | 'auto_improve' | 'style_change' | 'lyrics_change') => {
    if (!track.id) return;
    
    setIsCreatingVariation(true);
    try {
      await createVariation(track.id, type, {
        title: `${track.title} - Вариация`,
        description: `Вариация трека "${track.title}"`,
        user_id: track.user_id,
        provider: track.provider || 'suno'
      });
      
      // Callback to parent component if provided
      onCreateVariation?.(track.id, type);
    } catch (error) {
      console.error('Failed to create variation:', error);
    } finally {
      setIsCreatingVariation(false);
    }
  };

  const getVariationTypeIcon = (type: string) => {
    switch (type) {
      case 'auto_improve':
        return <Wand2 className="h-4 w-4" />;
      case 'style_change':
        return <Palette className="h-4 w-4" />;
      case 'lyrics_change':
        return <FileText className="h-4 w-4" />;
      default:
        return <Music className="h-4 w-4" />;
    }
  };

  const getVariationTypeLabel = (type: string) => {
    switch (type) {
      case 'auto_improve':
        return 'Улучшение ИИ';
      case 'style_change':
        return 'Смена стиля';
      case 'lyrics_change':
        return 'Новый текст';
      case 'manual':
        return 'Ручная вариация';
      default:
        return 'Оригинал';
    }
  };

  const getVariationTypeColor = (type: string) => {
    switch (type) {
      case 'auto_improve':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'style_change':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lyrics_change':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'manual':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Вариации трека
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Загружаем вариации...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Track Hierarchy Info */}
      {(isDraft || parentTrack || childVariations.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Структура вариаций
              {isDraft && (
                <Badge variant="outline" className="ml-2">
                  <Star className="h-3 w-3 mr-1" />
                  Черновик
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Parent Track */}
            {parentTrack && (
              <div className="p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2 text-sm">
                  <ArrowRight className="h-4 w-4 rotate-180" />
                  <span className="font-medium">Родительский трек:</span>
                </div>
                <div className="ml-6 mt-1">
                  <span className="text-sm text-muted-foreground">
                    {/* Parent track title would be fetched */}
                    Оригинальный трек
                  </span>
                </div>
              </div>
            )}

            {/* Current Track */}
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-primary" />
                  <span className="font-medium">{track.title}</span>
                  {isDraft && (
                    <Badge variant="outline">Черновик</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">Текущий</span>
              </div>
            </div>

            {/* Child Variations */}
            {childVariations.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium flex items-center gap-2">
                  <ArrowRight className="h-4 w-4" />
                  Вариации ({childVariations.length}):
                </div>
                <div className="ml-6 space-y-2">
                  {childVariations.map((variation) => (
                    <div
                      key={variation.id}
                      className="flex items-center justify-between p-2 bg-muted/20 rounded border"
                    >
                      <div className="flex items-center gap-2">
                        {getVariationTypeIcon(variation.variation_type)}
                        <span className="text-sm">Вариация #{variation.id.slice(0, 8)}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn('text-xs', getVariationTypeColor(variation.variation_type))}
                      >
                        {getVariationTypeLabel(variation.variation_type)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Variations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Создать вариацию
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => handleCreateVariation('auto_improve')}
              disabled={isCreatingVariation}
            >
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">Улучшить ИИ</div>
                  <div className="text-xs text-muted-foreground">
                    Автоматическое улучшение качества
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => handleCreateVariation('style_change')}
              disabled={isCreatingVariation}
            >
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Сменить стиль</div>
                  <div className="text-xs text-muted-foreground">
                    Изменить музыкальный стиль
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => handleCreateVariation('lyrics_change')}
              disabled={isCreatingVariation}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Новый текст</div>
                  <div className="text-xs text-muted-foreground">
                    Сгенерировать новые слова
                  </div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 h-auto p-4"
              onClick={() => handleCreateVariation('manual')}
              disabled={isCreatingVariation}
            >
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-orange-600" />
                <div className="text-left">
                  <div className="font-medium">Ручная вариация</div>
                  <div className="text-xs text-muted-foreground">
                    Создать с настройками
                  </div>
                </div>
              </div>
            </Button>
          </div>

          {isCreatingVariation && (
            <div className="text-center py-4">
              <div className="text-sm text-muted-foreground">
                Создаем вариацию трека...
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-700">
                Ошибка: {String(error)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}