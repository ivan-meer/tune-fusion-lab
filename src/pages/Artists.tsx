import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import { useArtists } from '@/hooks/useArtists';
import { useProjects } from '@/hooks/useProjects';
import Header from '@/components/layout/Header';
import { ArtistForm } from '@/components/artists/ArtistForm';
import { ArtistCard } from '@/components/artists/ArtistCard';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { PageTransition } from '@/components/ui/page-transition';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, Mic, Sparkles, Music, Search, Zap, Star } from 'lucide-react';
import type { Artist, Project } from '@/types/artist';

export const Artists = () => {
  const { user } = useAuth();
  const { artists, isLoading, createArtist, updateArtist, deleteArtist } = useArtists();
  const { projects, createProject } = useProjects();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [artistFormOpen, setArtistFormOpen] = useState(false);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [selectedArtistForProject, setSelectedArtistForProject] = useState<Artist | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (artist.style && artist.style.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getProjectCountForArtist = (artistId: string) => {
    return projects.filter(project => project.artist_id === artistId).length;
  };

  const handleCreateArtist = () => {
    setEditingArtist(null);
    setArtistFormOpen(true);
  };

  const handleEditArtist = (artist: Artist) => {
    setEditingArtist(artist);
    setArtistFormOpen(true);
  };

  const handleCreateProject = (artist: Artist) => {
    setSelectedArtistForProject(artist);
    setProjectFormOpen(true);
  };

  const handleArtistSubmit = async (data: Omit<Artist, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setIsSubmitting(true);
    try {
      if (editingArtist) {
        await updateArtist(editingArtist.id, data);
      } else {
        await createArtist(data);
      }
      setArtistFormOpen(false);
      setEditingArtist(null);
    } catch (error) {
      console.error('Error saving artist:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectSubmit = async (data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setIsSubmitting(true);
    try {
      await createProject(data);
      setProjectFormOpen(false);
      setSelectedArtistForProject(null);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewProjects = (artist: Artist) => {
    console.log('View projects for artist:', artist.name);
  };

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          
          <AnimatedCard variant="glass" className="w-full max-w-md mx-4">
            <CardContent className="text-center p-8 space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-soft">
                  <Users className="h-10 w-10 text-white" />
                </div>
              </motion.div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold gradient-text">Войдите в систему</h2>
                <p className="text-muted-foreground">
                  Для управления артистами и проектами необходимо войти в систему.
                </p>
              </div>
              
              <EnhancedButton 
                variant="primary" 
                withGlow 
                className="w-full"
                onClick={() => window.location.href = '/auth'}
              >
                <Zap className="w-4 h-4 mr-2" />
                Войти в систему
              </EnhancedButton>
            </CardContent>
          </AnimatedCard>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8 space-y-8">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl p-8 glassmorphism-strong"
          >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="glassmorphism pulse-glow">
                    <Music className="w-4 h-4 mr-2" />
                    AI Artists Hub
                  </Badge>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold">
                  <span className="gradient-text">Артисты</span> и Группы
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Создавайте уникальных артистов, управляйте их стилем и развивайте 
                  музыкальные проекты с помощью ИИ.
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" />
                    <span>{artists.length} артистов</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>{projects.length} проектов</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <EnhancedButton 
                  variant="primary" 
                  withGlow 
                  magnetic
                  onClick={handleCreateArtist}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Создать артиста
                </EnhancedButton>
              </div>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative"
          >
            <AnimatedCard variant="glass" className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск артистов по имени или стилю..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glassmorphism border-border/30 focus:border-primary/50"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Найдено: {filteredArtists.length}</span>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Artists Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <AnimatedCard key={i} variant="glass" className="animate-pulse">
                    <CardHeader>
                      <div className="h-16 bg-muted/50 rounded loading-pulse" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-4 bg-muted/50 rounded w-3/4 loading-pulse" />
                        <div className="h-3 bg-muted/50 rounded w-1/2 loading-pulse" />
                        <div className="h-8 bg-muted/50 rounded w-full loading-pulse" />
                      </div>
                    </CardContent>
                  </AnimatedCard>
                ))}
              </div>
            ) : filteredArtists.length === 0 ? (
              <AnimatedCard variant="glass" className="text-center p-12">
                <CardContent className="space-y-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Users className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {searchQuery ? 'Артисты не найдены' : 'Создайте первого артиста'}
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {searchQuery 
                        ? 'Попробуйте изменить поисковый запрос или создайте нового артиста' 
                        : 'Начните свой путь в музыке с создания уникального артиста или группы'
                      }
                    </p>
                  </div>
                  
                  <EnhancedButton 
                    variant="primary" 
                    withGlow
                    onClick={handleCreateArtist}
                    className="mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {searchQuery ? 'Создать артиста' : 'Создать первого артиста'}
                  </EnhancedButton>
                </CardContent>
              </AnimatedCard>
            ) : (
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1
                    }
                  }
                }}
              >
                {filteredArtists.map((artist, index) => (
                  <motion.div
                    key={artist.id}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.95 },
                      visible: { opacity: 1, y: 0, scale: 1 }
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  >
                    <ArtistCard
                      artist={artist}
                      projectCount={getProjectCountForArtist(artist.id)}
                      onEdit={handleEditArtist}
                      onDelete={deleteArtist}
                      onCreateProject={handleCreateProject}
                      onViewProjects={handleViewProjects}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </main>

        {/* Artist Form Dialog */}
        <Dialog open={artistFormOpen} onOpenChange={setArtistFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glassmorphism-strong border-border/20">
            <DialogHeader>
              <DialogTitle className="gradient-text">
                {editingArtist ? 'Редактировать артиста' : 'Создать нового артиста'}
              </DialogTitle>
            </DialogHeader>
            <ArtistForm
              artist={editingArtist || undefined}
              onSubmit={handleArtistSubmit}
              onCancel={() => setArtistFormOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>

        {/* Project Form Dialog */}
        <Dialog open={projectFormOpen} onOpenChange={setProjectFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glassmorphism-strong border-border/20">
            <DialogHeader>
              <DialogTitle className="gradient-text">Создать новый проект</DialogTitle>
            </DialogHeader>
            <ProjectForm
              artists={artists}
              preselectedArtistId={selectedArtistForProject?.id}
              onSubmit={handleProjectSubmit}
              onCancel={() => setProjectFormOpen(false)}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default Artists;