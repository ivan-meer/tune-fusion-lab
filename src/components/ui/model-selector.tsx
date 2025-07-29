import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Music, Zap, Star, Clock, DollarSign } from 'lucide-react';

export type ModelType = 'V4_5' | 'V4' | 'V3_5' | 'mureka-v7' | 'mureka-o1' | 'mureka-v6' | 'auto' | 'test';

interface ModelInfo {
  id: ModelType;
  name: string;
  provider: string;
  description: string;
  features: string[];
  cost: number;
  duration: string;
  quality: number; // 1-5 stars
  icon: any;
  badge?: string;
}

const modelConfigs: ModelInfo[] = [
  // Suno Models
  {
    id: 'V4_5',
    name: 'Suno V4.5',
    provider: 'Suno AI',
    description: 'Новейшая модель Suno с расширенными жанрами и улучшенным вокалом',
    features: ['Максимальное качество', 'Расширенные жанры', 'Лучший вокал', 'До 5000 символов'],
    cost: 15,
    duration: 'До 4 минут',
    quality: 5,
    icon: Sparkles,
    badge: 'Рекомендуется'
  },
  {
    id: 'V4',
    name: 'Suno V4',
    provider: 'Suno AI',
    description: 'Продвинутая модель с высоким качеством вокала',
    features: ['Отличное качество', 'Хороший вокал', 'Extend & Cover', 'Persona'],
    cost: 10,
    duration: 'До 4 минут',
    quality: 4,
    icon: Sparkles
  },
  {
    id: 'V3_5',
    name: 'Suno V3.5',
    provider: 'Suno AI',
    description: 'Стабильная модель с хорошей структурой песен',
    features: ['Быстрая генерация', 'Хорошая структура', 'Стабильность'],
    cost: 8,
    duration: 'До 4 минут',
    quality: 3,
    icon: Music
  },
  
  // Mureka Models
  {
    id: 'mureka-v7',
    name: 'Mureka V7',
    provider: 'Mureka AI',
    description: 'Новейшая модель Mureka с кастомизацией тембра и улучшенным качеством',
    features: ['Высочайшее качество', 'Кастомизация тембра', 'Продвинутая аранжировка', 'Голосовой дизайн'],
    cost: 25,
    duration: '3-5 мин',
    quality: 5,
    icon: Sparkles,
    badge: 'Новинка'
  },
  {
    id: 'mureka-o1',
    name: 'Mureka O1',
    provider: 'Mureka AI',
    description: 'Модель с рассуждениями для сложной музыкальной композиции и BGM',
    features: ['Музыкальные рассуждения', 'Сложная композиция', 'Многоязычность', 'BGM генерация', 'ИИ редактирование'],
    cost: 30,
    duration: '3-6 мин',
    quality: 5,
    icon: Sparkles,
    badge: 'Продвинутая'
  },
  {
    id: 'mureka-v6',
    name: 'Mureka V6',
    provider: 'Mureka AI',
    description: 'Стабильная модель Mureka для качественной генерации музыки',
    features: ['Сложные аранжировки', 'Профессиональный звук', 'Длинные треки', 'Голосовая кастомизация'],
    cost: 20,
    duration: '3-5 мин',
    quality: 4,
    icon: Music
  },
  {
    id: 'auto',
    name: 'Mureka Auto',
    provider: 'Mureka AI',
    description: 'Автоматический выбор лучшей модели Mureka для вашего запроса',
    features: ['Автовыбор модели', 'Оптимизация', 'Простота использования', 'Универсальность'],
    cost: 15,
    duration: '3-5 мин',
    quality: 4,
    icon: Zap
  },
  
  // Test Model
  {
    id: 'test',
    name: 'Тестовая модель',
    provider: 'Внутренняя',
    description: 'Для тестирования функциональности без затрат',
    features: ['Бесплатно', 'Быстро', 'Демо-контент'],
    cost: 0,
    duration: '10 сек',
    quality: 2,
    icon: Zap
  }
];

interface ModelSelectorProps {
  value: ModelType;
  onChange: (model: ModelType) => void;
  provider?: 'suno' | 'mureka' | 'test' | 'all';
  showDetails?: boolean;
}

export default function ModelSelector({ value, onChange, provider = 'all', showDetails = true }: ModelSelectorProps) {
  const availableModels = modelConfigs.filter(model => {
    if (provider === 'all') return true;
    if (provider === 'suno') return ['V4_5', 'V4', 'V3_5'].includes(model.id);
    if (provider === 'mureka') return ['mureka-v7', 'mureka-o1', 'mureka-v6', 'auto'].includes(model.id);
    if (provider === 'test') return model.id === 'test';
    return true;
  });

  const selectedModel = modelConfigs.find(model => model.id === value);

  const renderStars = (quality: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < quality ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Модель ИИ</Label>
        <Select value={value} onValueChange={(val: ModelType) => onChange(val)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((model) => {
              const Icon = model.icon;
              return (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{model.name}</span>
                        <div className="flex items-center">
                          {renderStars(model.quality)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {model.cost > 0 ? `${model.cost} кредитов` : 'Бесплатно'} • {model.duration}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {showDetails && selectedModel && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <selectedModel.icon className="h-5 w-5" />
              <CardTitle className="text-base">{selectedModel.name}</CardTitle>
              <Badge variant="outline">{selectedModel.provider}</Badge>
            </div>
            <CardDescription className="text-sm">
              {selectedModel.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">Качество:</span>
                <div className="flex items-center">
                  {renderStars(selectedModel.quality)}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">{selectedModel.duration}</span>
              </div>
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {selectedModel.cost > 0 ? `${selectedModel.cost} кред.` : 'Бесплатно'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium mb-2">Особенности:</div>
              <div className="flex flex-wrap gap-1">
                {selectedModel.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}