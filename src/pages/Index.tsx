import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Music, 
  Play, 
  Sparkles, 
  Brain, 
  Headphones, 
  Star,
  TrendingUp,
  Users,
  Zap,
  Heart
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import Header from '@/components/layout/Header';
import MusicStudio from '@/components/music/MusicStudio';
import heroImage from '@/assets/hero-music-ai.jpg';

const Index = () => {
  const { user, isLoading } = useAuth();

  const featuredTracks = [
    {
      id: '1',
      title: 'Неоновые Сны',
      artist: 'ИИ Композитор',
      genre: 'Электронная',
      plays: 1284,
      likes: 89,
      duration: '3:42'
    },
    {
      id: '2', 
      title: 'Полночный Джаз',
      artist: 'Нейронный Оркестр',
      genre: 'Джаз',
      plays: 956,
      likes: 67,
      duration: '4:15'
    },
    {
      id: '3',
      title: 'Космическое Путешествие',
      artist: 'ИИ Симфонический',
      genre: 'Эмбиент',
      plays: 2143,
      likes: 156,
      duration: '5:28'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Добро пожаловать, {user.email?.split('@')[0]}!
              </h1>
              <p className="text-muted-foreground">
                Создавайте невероятную музыку с помощью ИИ
              </p>
            </div>
            <MusicStudio />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <Badge variant="secondary" className="inline-flex items-center space-x-1 pulse-glow">
                  <Sparkles className="w-3 h-3" />
                  <span>ИИ-Генерация Музыки</span>
                </Badge>
                
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  Создавайте{' '}
                  <span className="gradient-text">
                    Невероятную Музыку
                  </span>{' '}
                  с помощью ИИ
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Превратите свои идеи в профессиональную музыку с помощью передовых ИИ-технологий. 
                  Создавайте альбомы, треки, ремиксы и каверы. Организуйте свою музыкальную библиотеку.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
                  asChild
                >
                  <a href="/auth">
                    <Play className="w-5 h-5 mr-2" />
                    Начать Создавать
                  </a>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  asChild
                >
                  <a href="/auth">
                    Войти
                  </a>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border/50">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">50K+</div>
                  <div className="text-sm text-muted-foreground">Треков Создано</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">15K+</div>
                  <div className="text-sm text-muted-foreground">Активных Артистов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">99%</div>
                  <div className="text-sm text-muted-foreground">Довольных Пользователей</div>
                </div>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden glassmorphism p-8 music-visualizer">
                <img 
                  src={heroImage} 
                  alt="ИИ Генерация Музыки" 
                  className="w-full h-auto rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg" />
                
                {/* Floating Audio Player */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="absolute bottom-4 left-4 right-4 p-4 glassmorphism rounded-lg"
                >
                  <div className="text-center text-sm text-muted-foreground">
                    🎵 Аудиоплеер скоро...
                  </div>
                </motion.div>
              </div>

              {/* Floating Elements */}
              <motion.div
                className="absolute -top-4 -right-4 p-3 rounded-full glassmorphism glow-primary floating-animation"
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-6 h-6 text-primary" />
              </motion.div>
              
              <motion.div
                className="absolute -bottom-4 -left-4 p-3 rounded-full glassmorphism glow-accent floating-animation"
                animate={{ rotate: -360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              >
                <Headphones className="w-6 h-6 text-accent" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Tracks */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Популярные ИИ Треки</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Откройте для себя последние треки, созданные нашим ИИ-сообществом
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {featuredTracks.map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="glassmorphism hover:scale-105 transition-all duration-300 group cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant="secondary">{track.genre}</Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <h3 className="font-semibold mb-2">{track.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{track.artist}</p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {track.plays}
                        </span>
                        <span className="flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          {track.likes}
                        </span>
                      </div>
                      <span>{track.duration}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Мощные Возможности Музыкального ИИ</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Всё необходимое для создания профессиональной музыки с искусственным интеллектом
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: 'ИИ-Генерация',
                description: 'Продвинутые нейронные сети создают уникальные композиции на основе ваших промптов'
              },
              {
                icon: Zap,
                title: 'Молниеносная Скорость',
                description: 'Генерируйте профессиональные треки менее чем за 30 секунд'
              },
              {
                icon: Users,
                title: 'Множество Провайдеров',
                description: 'Интеграция с Mureka AI и Suno для лучших результатов'
              },
              {
                icon: Music,
                title: 'Все Жанры',
                description: 'От электронной до классической музыки - создавайте в любом стиле'
              },
              {
                icon: Headphones,
                title: 'Студийное Качество',
                description: 'Экспорт в различных форматах со студийным качеством звука'
              },
              {
                icon: Star,
                title: 'Простота Использования',
                description: 'Интуитивный интерфейс для новичков и профессионалов'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="p-4 rounded-full bg-primary/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h2 className="text-3xl font-bold">
              Готовы создать свой первый ИИ-трек?
            </h2>
            <p className="text-xl text-muted-foreground">
              Присоединяйтесь к тысячам артистов, создающих удивительную музыку с ИИ
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-primary"
                asChild
              >
                <a href="/auth">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Начать Бесплатно
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                asChild
              >
                <a href="/auth">
                  У меня есть аккаунт
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Index;
