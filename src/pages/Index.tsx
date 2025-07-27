import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { PageTransition } from '@/components/ui/page-transition';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';
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
  Heart,
  Cpu,
  Waves,
  Mic,
  Download,
  Share,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import Header from '@/components/layout/Header';
import MusicStudio from '@/components/music/MusicStudio';
import MusicAidPro from '@/components/music/MusicAidPro';
import { 
  ParallaxScroll, 
  CountUp, 
  StaggeredReveal, 
  MagneticHover, 
  NeuralNetworkBg 
} from '@/components/ui/scroll-animations';
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
        <main className="py-4">
          <MusicAidPro />
        </main>
      </div>
    );
  }

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, -100]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0.8]);

  return (
    <PageTransition>
      <div className="min-h-screen relative overflow-hidden">
      {/* Neural Network Background */}
      <NeuralNetworkBg className="fixed inset-0 z-0" />
      
      {/* Main Background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-background via-background to-muted/10" 
           style={{ background: 'var(--gradient-bg)' }} />
      
      <div className="relative z-10">
        <Header />

        {/* Hero Section */}
        <motion.section 
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative min-h-screen flex items-center justify-center overflow-hidden"
        >
          {/* Animated Grid Background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" 
                 style={{
                   backgroundImage: `
                     linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                     linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
                   `,
                   backgroundSize: '50px 50px'
                 }}>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center space-y-12">
              
              {/* AI Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                <MagneticHover>
                  <Badge 
                    variant="secondary" 
                    className="inline-flex items-center space-x-2 px-6 py-3 text-sm glassmorphism-strong pulse-glow"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Powered by Neural AI</span>
                    <Sparkles className="w-4 h-4" />
                  </Badge>
                </MagneticHover>
              </motion.div>
              
              {/* Main Heading */}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="space-y-6"
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold leading-tight tracking-tight px-4">
                  Создавайте{' '}
                  <span className="gradient-text block lg:inline">
                    Будущее Музыки
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4">
                  Революционная платформа для создания профессиональной музыки с помощью 
                  искусственного интеллекта. От идеи до готового трека за секунды.
                </p>
              </motion.div>

              {/* Enhanced CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
              >
                <MagneticHover>
                  <EnhancedButton 
                    size="lg" 
                    variant="primary"
                    withGlow
                    magnetic
                    className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg"
                    asChild
                  >
                    <a href="/auth" className="flex items-center justify-center">
                      <Play className="w-5 sm:w-6 h-5 sm:h-6 mr-2 sm:mr-3" />
                      <span className="hidden sm:inline">Создать Первый Трек</span>
                      <span className="sm:hidden">Создать Трек</span>
                      <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5 ml-2" />
                    </a>
                  </EnhancedButton>
                </MagneticHover>
                
                <EnhancedButton 
                  size="lg" 
                  variant="glass"
                  className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg"
                  asChild
                >
                  <a href="#demo" className="flex items-center justify-center">
                    <Waves className="w-5 h-5 mr-2" />
                    Смотреть Демо
                  </a>
                </EnhancedButton>
              </motion.div>

              {/* Stats Counter */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 pt-12 sm:pt-16 max-w-4xl mx-auto px-4"
              >
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-2">
                    <CountUp end={50} suffix="K+" />
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground">Треков Создано</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-2">
                    <CountUp end={15} suffix="K+" />
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground">Активных Артистов</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold gradient-text mb-2">
                    <CountUp end={99} suffix="%" />
                  </div>
                  <div className="text-sm sm:text-base text-muted-foreground">Довольных Пользователей</div>
                </div>
              </motion.div>

              {/* Scroll Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              >
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex flex-col items-center text-muted-foreground"
                >
                  <span className="text-sm mb-2">Прокрутите вниз</span>
                  <ChevronDown className="w-6 h-6" />
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Floating AI Elements */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              className="absolute top-1/4 left-20 p-4 rounded-full glassmorphism glow-primary"
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 180, 360] 
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            >
              <Cpu className="w-8 h-8 text-primary" />
            </motion.div>
            
            <motion.div
              className="absolute top-1/3 right-20 p-4 rounded-full glassmorphism glow-accent"
              animate={{ 
                y: [0, 15, 0],
                rotate: [0, -180, -360] 
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 1
              }}
            >
              <Mic className="w-8 h-8 text-accent" />
            </motion.div>

            <motion.div
              className="absolute bottom-1/3 left-1/4 p-3 rounded-full glassmorphism glow-soft"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 2
              }}
            >
              <Headphones className="w-6 h-6 text-primary" />
            </motion.div>
          </div>
        </motion.section>

        {/* Featured Tracks Section */}
        <ParallaxScroll speed={0.3} className="py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/5 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <Badge 
                variant="secondary" 
                className="mb-6 glassmorphism-strong neural-pulse"
              >
                <Music className="w-4 h-4 mr-2" />
                Trending AI Tracks
              </Badge>
              
              <h2 className="text-4xl lg:text-6xl font-bold mb-6">
                Популярные{' '}
                <span className="gradient-text-accent">ИИ Треки</span>
              </h2>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Откройте для себя потрясающие композиции, созданные нашим ИИ-сообществом. 
                Каждый трек - это уникальное произведение искусства.
              </p>
            </motion.div>

            <StaggeredReveal className="grid md:grid-cols-3 gap-8" delay={0.15}>
              {featuredTracks.map((track, index) => (
                <MagneticHover key={track.id} strength={15}>
                  <AnimatedCard 
                    variant="glass" 
                    hover3d 
                    glowEffect 
                    className="group cursor-pointer relative overflow-hidden border-border/10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <CardContent className="p-8 relative z-10">
                      {/* Header with genre and play button */}
                      <div className="flex items-center justify-between mb-6">
                        <Badge 
                          variant="secondary" 
                          className="glassmorphism text-xs px-3 py-1"
                        >
                          {track.genre}
                        </Badge>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button 
                            size="sm" 
                            className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-primary/20 hover:bg-primary/30 backdrop-blur-sm"
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </div>
                      
                      {/* Track info */}
                      <div className="space-y-3 mb-6">
                        <h3 className="text-xl font-bold group-hover:gradient-text transition-all duration-300">
                          {track.title}
                        </h3>
                        <p className="text-muted-foreground font-medium">
                          {track.artist}
                        </p>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {track.plays.toLocaleString()}
                          </span>
                          <span className="flex items-center text-muted-foreground hover:text-accent transition-colors">
                            <Heart className="w-4 h-4 mr-1" />
                            {track.likes}
                          </span>
                        </div>
                        <span className="text-muted-foreground font-mono">
                          {track.duration}
                        </span>
                      </div>

                      {/* Enhanced Audio Visualizer */}
                      <div className="mt-6 h-12 bg-muted/20 rounded-lg flex items-center justify-center overflow-hidden relative">
                        <AudioVisualizer 
                          isPlaying={false} 
                          barCount={20} 
                          className="group-hover:opacity-100 opacity-50 transition-opacity duration-500" 
                        />
                      </div>
                    </CardContent>
                  </AnimatedCard>
                </MagneticHover>
              ))}
            </StaggeredReveal>
          </div>
        </ParallaxScroll>

        {/* AI Features Section */}
        <section className="py-32 relative overflow-hidden">
          {/* Background mesh gradient */}
          <div className="absolute inset-0 bg-gradient-mesh opacity-30" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              viewport={{ once: true }}
              className="text-center mb-24"
            >
              <Badge 
                variant="secondary" 
                className="mb-8 glassmorphism-strong glow-soft"
              >
                <Cpu className="w-4 h-4 mr-2" />
                AI-Powered Features
              </Badge>
              
              <h2 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
                Мощные{' '}
                <span className="gradient-text block lg:inline">
                  Возможности ИИ
                </span>
              </h2>
              
              <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Передовые технологии искусственного интеллекта для создания 
                профессиональной музыки любого жанра и стиля.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Brain,
                  title: 'Neural Composition',
                  subtitle: 'ИИ-Генерация',
                  description: 'Продвинутые нейронные сети создают уникальные композиции на основе ваших промптов',
                  color: 'primary'
                },
                {
                  icon: Zap,
                  title: 'Lightning Speed',
                  subtitle: 'Молниеносная Скорость',
                  description: 'Генерируйте профессиональные треки менее чем за 30 секунд',
                  color: 'accent'
                },
                {
                  icon: Users,
                  title: 'Multi-Provider',
                  subtitle: 'Множество Провайдеров',
                  description: 'Интеграция с Mureka AI, Suno и другими для лучших результатов',
                  color: 'primary'
                },
                {
                  icon: Music,
                  title: 'Universal Genres',
                  subtitle: 'Все Жанры',
                  description: 'От электронной до классической музыки - создавайте в любом стиле',
                  color: 'accent'
                },
                {
                  icon: Headphones,
                  title: 'Studio Quality',
                  subtitle: 'Студийное Качество',
                  description: 'Экспорт в различных форматах со студийным качеством звука',
                  color: 'primary'
                },
                {
                  icon: Star,
                  title: 'User Friendly',
                  subtitle: 'Простота Использования',
                  description: 'Интуитивный интерфейс для новичков и профессионалов',
                  color: 'accent'
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  viewport={{ once: true }}
                  className="group"
                >
                  <MagneticHover>
                    <Card className="glassmorphism-strong hover-glow h-full p-8 text-center relative overflow-hidden border-border/10">
                      {/* Hover gradient overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${
                        feature.color === 'primary' 
                          ? 'from-primary/5 via-transparent to-primary/10' 
                          : 'from-accent/5 via-transparent to-accent/10'
                      } opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      <div className="relative z-10 space-y-6">
                        {/* Icon */}
                        <motion.div
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center glassmorphism ${
                            feature.color === 'primary' ? 'glow-primary' : 'glow-accent'
                          } group-hover:glow-intense transition-all duration-300`}
                        >
                          <feature.icon className={`w-10 h-10 ${
                            feature.color === 'primary' ? 'text-primary' : 'text-accent'
                          }`} />
                        </motion.div>
                        
                        {/* Title and subtitle */}
                        <div className="space-y-2">
                          <div className={`text-sm font-medium ${
                            feature.color === 'primary' ? 'text-primary' : 'text-accent'
                          }`}>
                            {feature.title}
                          </div>
                          <h3 className="text-2xl font-bold group-hover:gradient-text transition-all duration-300">
                            {feature.subtitle}
                          </h3>
                        </div>
                        
                        {/* Description */}
                        <p className="text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>

                        {/* Learn more link */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="flex items-center justify-center text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <span>Узнать больше</span>
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </motion.div>
                      </div>
                    </Card>
                  </MagneticHover>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-32 relative overflow-hidden">
          <ParallaxScroll speed={0.5}>
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/15 to-primary/10" />
            <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
            
            {/* Floating elements */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/30 rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -50, 0],
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 4 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                viewport={{ once: true }}
                className="space-y-12"
              >
                {/* Badge */}
                <Badge 
                  variant="secondary" 
                  className="glassmorphism-strong glow-intense pulse-glow"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ready to Create?
                  <Sparkles className="w-4 h-4 ml-2" />
                </Badge>

                {/* Heading */}
                <div className="space-y-6">
                  <h2 className="text-5xl lg:text-7xl font-bold leading-tight">
                    Создайте свой первый{' '}
                    <span className="gradient-text block lg:inline">
                      ИИ-шедевр
                    </span>{' '}
                    прямо сейчас
                  </h2>
                  
                  <p className="text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                    Присоединяйтесь к революции в создании музыки. Более{' '}
                    <span className="gradient-text font-semibold">50,000</span>{' '}
                    артистов уже создают невероятные треки с помощью нашего ИИ.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
                  <MagneticHover>
                    <Button 
                      size="lg"
                      className="px-16 py-8 text-xl bg-gradient-to-r from-primary via-primary-variant to-accent hover:opacity-90 glow-intense group relative overflow-hidden"
                      asChild
                    >
                      <a href="/auth" className="flex items-center">
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="mr-4"
                        >
                          <Sparkles className="w-6 h-6" />
                        </motion.div>
                        Создать Бесплатно
                        <motion.div
                          className="ml-3 group-hover:translate-x-1 transition-transform"
                        >
                          <ArrowRight className="w-6 h-6" />
                        </motion.div>
                      </a>
                    </Button>
                  </MagneticHover>
                  
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="px-12 py-8 text-lg glassmorphism-strong border-border/30 hover-glow"
                    asChild
                  >
                    <a href="/auth" className="flex items-center">
                      <Download className="w-5 h-5 mr-2" />
                      Демо Версия
                    </a>
                  </Button>
                </div>

                {/* Social proof */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="flex items-center justify-center space-x-8 pt-12 text-sm text-muted-foreground"
                >
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-accent mr-1" />
                    <span>4.9/5 Рейтинг</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 text-primary mr-1" />
                    <span>15K+ Пользователей</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="w-4 h-4 text-accent mr-1" />
                    <span>1M+ Треков</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </ParallaxScroll>
        </section>
      </div>
    </div>
    </PageTransition>
  );
};

export default Index;
