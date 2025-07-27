/**
 * Simplified Music App Component
 * 
 * Упрощенная архитектура приложения:
 * - Объединенный интерфейс создания музыки
 * - Библиотека треков
 * - Простая навигация
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Library, Sparkles, Settings, Layers, Upload } from 'lucide-react';

import UnifiedMusicStudio from '../UnifiedMusicStudio';
import TrackLibrary from '../TrackLibrary';
import TrackUploader from '../TrackUploader';
import UploadAnalytics from '../UploadAnalytics';
import { MusicPipeline } from '../pipeline/MusicPipeline';
import { PipelineFragments } from '../pipeline/PipelineFragments';

export default function MusicApp() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* App Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            MusicAid Pro
          </h1>
          <Badge variant="secondary" className="hidden sm:flex">
            AI Assistant
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          Профессиональный помощник музыканта на базе искусственного интеллекта
        </p>
      </div>

      {/* Main Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto h-12">
          <TabsTrigger value="create" className="flex items-center gap-2 text-sm font-medium">
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">Создать</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2 text-sm font-medium">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Загрузить</span>
          </TabsTrigger>
          <TabsTrigger value="pipeline" className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Обработка</span>
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2 text-sm font-medium">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Библиотека</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Аналитика</span>
          </TabsTrigger>
        </TabsList>

        {/* Create Music Tab */}
        <TabsContent value="create" className="space-y-6">
          <UnifiedMusicStudio />
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <TrackUploader />
        </TabsContent>

        {/* Processing Tab - Combines Pipeline and Fragments */}
        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Полный пайплайн
                </CardTitle>
              </CardHeader>
            </Card>
            <MusicPipeline />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  Отдельные операции
                </CardTitle>
              </CardHeader>
            </Card>
            <PipelineFragments />
          </div>
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <TrackLibrary />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <UploadAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}