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
import { Music, Library, Sparkles } from 'lucide-react';

import MusicCreator from '../unified/MusicCreator';
import TrackLibrary from '../TrackLibrary';

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
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12">
          <TabsTrigger 
            value="create" 
            className="flex items-center gap-2 text-base font-medium"
          >
            <Music className="h-5 w-5" />
            <span>Создать</span>
          </TabsTrigger>
          <TabsTrigger 
            value="library" 
            className="flex items-center gap-2 text-base font-medium"
          >
            <Library className="h-5 w-5" />
            <span>Библиотека</span>
          </TabsTrigger>
        </TabsList>

        {/* Create Music Tab */}
        <TabsContent value="create" className="space-y-6">
          <MusicCreator />
        </TabsContent>

        {/* Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5 text-primary" />
                Ваша музыкальная библиотека
              </CardTitle>
            </CardHeader>
          </Card>
          <TrackLibrary />
        </TabsContent>
      </Tabs>
    </div>
  );
}