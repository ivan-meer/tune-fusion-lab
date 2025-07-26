import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MusicStudio from './MusicStudio';
import LyricsStudio from './LyricsStudio';
import TrackLibrary from './TrackLibrary';
import { Music, PenTool, Library, Mic, Video, Settings, Sparkles } from 'lucide-react';

export default function MusicAidPro() {
  const [activeTab, setActiveTab] = useState('music');

  const modules = [
    {
      id: 'music',
      name: 'Генерация музыки',
      description: 'Создавайте треки с помощью ИИ',
      icon: Music,
      component: MusicStudio,
      badge: 'Suno V4'
    },
    {
      id: 'lyrics', 
      name: 'Студия лирики',
      description: 'Генерируйте тексты песен',
      icon: PenTool,
      component: LyricsStudio,
      badge: 'AI Writer'
    },
    {
      id: 'library',
      name: 'Библиотека',
      description: 'Ваши треки и проекты',
      icon: Library,
      component: TrackLibrary,
      badge: 'Личное'
    },
    {
      id: 'vocal',
      name: 'Обработка вокала',
      description: 'Разделение и улучшение',
      icon: Mic,
      component: () => <ComingSoon feature="Обработка вокала" />,
      badge: 'Скоро'
    },
    {
      id: 'video',
      name: 'Музыкальные видео',
      description: 'Создание визуалов',
      icon: Video,
      component: () => <ComingSoon feature="Музыкальные видео" />,
      badge: 'Скоро'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">MusicAid Pro</h1>
          <Badge variant="secondary">AI Assistant</Badge>
        </div>
        <p className="text-muted-foreground">
          Профессиональный помощник музыканта на базе искусственного интеллекта
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <TabsTrigger 
                key={module.id} 
                value={module.id}
                className="flex items-center gap-2"
              >
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{module.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {modules.map((module) => {
          const Component = module.component;
          return (
            <TabsContent key={module.id} value={module.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <module.icon className="h-6 w-6" />
                  <div>
                    <h2 className="text-xl font-semibold">{module.name}</h2>
                    <p className="text-muted-foreground text-sm">{module.description}</p>
                  </div>
                </div>
                <Badge variant="outline">{module.badge}</Badge>
              </div>
              
              <Component />
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

function ComingSoon({ feature }: { feature: string }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Settings className="h-5 w-5" />
          {feature}
        </CardTitle>
        <CardDescription>
          Этот модуль находится в разработке
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center py-8">
        <div className="space-y-4">
          <div className="text-6xl opacity-20">🚧</div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Скоро будет доступно</h3>
            <p className="text-muted-foreground">
              Мы работаем над этой функцией. Она будет добавлена в ближайших обновлениях.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Следите за обновлениями MusicAid Pro</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}