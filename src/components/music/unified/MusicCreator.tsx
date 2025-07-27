/**
 * Unified Music Creator Component
 * 
 * Объединяет все функции создания музыки в единый интерфейс:
 * - Простая генерация (MusicStudio)
 * - Продвинутая генерация (AdvancedMusicStudio)  
 * - Полный рабочий процесс (CompleteWorkflow)
 * - Генерация лирики (LyricsStudio)
 */

import { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Music, 
  PenTool, 
  Sparkles, 
  Settings2,
  Wand2,
  Brain,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Import existing components temporarily
import MusicStudio from '../MusicStudio';
import AdvancedMusicStudio from '../AdvancedMusicStudio';
import LyricsStudio from '../LyricsStudio';
import CompleteWorkflow from '../CompleteWorkflow';

type CreatorMode = 'simple' | 'advanced' | 'lyrics' | 'workflow';

const modes = [
  {
    id: 'simple' as CreatorMode,
    name: 'Быстрое создание',
    description: 'Создавайте музыку из простого описания',
    icon: Music,
    badge: 'Рекомендуемое',
    color: 'text-blue-500'
  },
  {
    id: 'workflow' as CreatorMode,
    name: 'Полный цикл',
    description: 'Идея → Текст → Музыка',
    icon: Sparkles,
    badge: 'Популярное',
    color: 'text-purple-500'
  },
  {
    id: 'lyrics' as CreatorMode,
    name: 'Только лирика',
    description: 'Генерация текстов песен',
    icon: PenTool,
    badge: 'Быстро',
    color: 'text-green-500'
  },
  {
    id: 'advanced' as CreatorMode,
    name: 'Продвинутое',
    description: 'Полный контроль параметров',
    icon: Settings2,
    badge: 'Профи',
    color: 'text-orange-500'
  }
];

export default function MusicCreator() {
  const [currentMode, setCurrentMode] = useState<CreatorMode>('simple');

  const currentModeData = modes.find(mode => mode.id === currentMode);

  const renderModeContent = () => {
    switch (currentMode) {
      case 'simple':
        return <MusicStudio />;
      case 'advanced':
        return <AdvancedMusicStudio />;
      case 'lyrics':
        return <LyricsStudio />;
      case 'workflow':
        return <CompleteWorkflow />;
      default:
        return <MusicStudio />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <Card className="border-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Выберите режим создания музыки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modes.map((mode) => {
              const IconComponent = mode.icon;
              const isActive = currentMode === mode.id;
              
              return (
                <motion.div
                  key={mode.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isActive 
                        ? 'ring-2 ring-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setCurrentMode(mode.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <IconComponent className={`h-6 w-6 ${mode.color}`} />
                        <Badge 
                          variant={isActive ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {mode.badge}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{mode.name}</h3>
                      <p className="text-sm text-muted-foreground leading-tight">
                        {mode.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Mode Header */}
      <motion.div
        layout
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {currentModeData && (
            <currentModeData.icon className={`h-6 w-6 ${currentModeData.color}`} />
          )}
          <div>
            <h2 className="text-2xl font-bold">{currentModeData?.name}</h2>
            <p className="text-muted-foreground">{currentModeData?.description}</p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Wand2 className="h-3 w-3" />
          {currentModeData?.badge}
        </Badge>
      </motion.div>

      {/* Mode Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense 
            fallback={
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Загрузка компонента...
                  </div>
                </CardContent>
              </Card>
            }
          >
            {renderModeContent()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}