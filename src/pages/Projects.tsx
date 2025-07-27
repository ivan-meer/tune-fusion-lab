import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { AnimatedCard } from '@/components/ui/animated-card';
import { PageTransition } from '@/components/ui/page-transition';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Plus, Search, Filter, Folder, Star, Sparkles, Zap } from 'lucide-react';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useArtists } from '@/hooks/useArtists';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/components/auth/AuthProvider';
import Header from '@/components/layout/Header';
import type { Project } from '@/types/artist';
import { PROJECT_TYPES } from '@/types/artist';

export const Projects = () => {
  const { user } = useAuth();
  const { artists } = useArtists();
  const { projects, isLoading, createProject, updateProject, deleteProject } = useProjects();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [artistFilter, setArtistFilter] = useState<string>('all');
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || project.type === typeFilter;
    const matchesArtist = artistFilter === 'all' || project.artist_id === artistFilter;
    
    return matchesSearch && matchesType && matchesArtist;
  });

  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectFormOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectFormOpen(true);
  };

  const handleProjectSubmit = async (data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setIsSubmitting(true);
    try {
      if (editingProject) {
        await updateProject(editingProject.id, data);
      } else {
        await createProject(data);
      }
      setProjectFormOpen(false);
      setEditingProject(null);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTrack = (project: Project) => {
    // Open track selection dialog
    console.log('Add track to project:', project.name);
  };

  const handleViewTracks = (project: Project) => {
    // Navigate to project tracks view
    console.log('View tracks for project:', project.name);
  };

  if (!user) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <Header />
          <div className="min-h-[calc(100vh-80px)] flex items-center justify-center relative overflow-hidden">
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
                    <Folder className="h-10 w-10 text-white" />
                  </div>
                </motion.div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold gradient-text">Войдите в систему</h2>
                  <p className="text-muted-foreground">
                    Для управления проектами необходимо войти в систему.
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
                    <Folder className="w-4 h-4 mr-2" />
                    Project Management
                  </Badge>
                </div>
                
                <h1 className="text-4xl lg:text-5xl font-bold">
                  <span className="gradient-text">Проекты</span> и Коллекции
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-2xl">
                  Управляйте своими музыкальными проектами, организуйте треки по 
                  альбомам и создавайте уникальные коллекции.
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-accent" />
                    <span>{projects.length} проектов</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>{artists.length} артистов</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <EnhancedButton 
                  variant="primary" 
                  withGlow 
                  magnetic
                  onClick={handleCreateProject}
                  disabled={artists.length === 0}
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Создать проект
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
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск проектов по названию..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glassmorphism border-border/30 focus:border-primary/50"
                  />
                </div>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-48 glassmorphism border-border/30">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glassmorphism-strong">
                    <SelectItem value="all">Все типы</SelectItem>
                    {Object.entries(PROJECT_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Artist Filter */}
                <Select value={artistFilter} onValueChange={setArtistFilter}>
                  <SelectTrigger className="w-full sm:w-48 glassmorphism border-border/30">
                    <SelectValue placeholder="Все артисты" />
                  </SelectTrigger>
                  <SelectContent className="glassmorphism-strong">
                    <SelectItem value="all">Все артисты</SelectItem>
                    {artists.map((artist) => (
                      <SelectItem key={artist.id} value={artist.id}>
                        {artist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Найдено: {filteredProjects.length}</span>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Projects Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {artists.length === 0 ? (
              <AnimatedCard variant="glass" className="text-center p-12">
                <CardContent className="space-y-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Music className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Сначала создайте артиста</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Для создания проектов вам нужно сначала создать артиста или группу.
                    </p>
                  </div>
                  
                  <EnhancedButton 
                    variant="primary" 
                    withGlow
                    onClick={() => window.location.href = '/artists'}
                    className="mx-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Создать артиста
                  </EnhancedButton>
                </CardContent>
              </AnimatedCard>
            ) : isLoading ? (
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
            ) : filteredProjects.length === 0 ? (
              <AnimatedCard variant="glass" className="text-center p-12">
                <CardContent className="space-y-6">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                      <Folder className="h-12 w-12 text-muted-foreground" />
                    </div>
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {searchQuery || typeFilter !== 'all' || artistFilter !== 'all' 
                        ? 'Проекты не найдены' 
                        : 'Создайте первый проект'
                      }
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      {searchQuery || typeFilter !== 'all' || artistFilter !== 'all'
                        ? 'Попробуйте изменить фильтры или поисковый запрос' 
                        : 'Начните организовывать свою музыку в проекты и альбомы'
                      }
                    </p>
                  </div>
                  
                  {!searchQuery && typeFilter === 'all' && artistFilter === 'all' && (
                    <EnhancedButton 
                      variant="primary" 
                      withGlow
                      onClick={handleCreateProject}
                      className="mx-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Создать проект
                    </EnhancedButton>
                  )}
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
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.95 },
                      visible: { opacity: 1, y: 0, scale: 1 }
                    }}
                    transition={{
                      duration: 0.5,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  >
                    <ProjectCard
                      project={project}
                      trackCount={0} // TODO: Get actual track count
                      onEdit={handleEditProject}
                      onDelete={deleteProject}
                      onAddTrack={handleAddTrack}
                      onViewTracks={handleViewTracks}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </main>

        {/* Project Form Dialog */}
        <Dialog open={projectFormOpen} onOpenChange={setProjectFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glassmorphism-strong border-border/20">
            <DialogHeader>
              <DialogTitle className="gradient-text">
                {editingProject ? 'Редактировать проект' : 'Создать новый проект'}
              </DialogTitle>
            </DialogHeader>
            <ProjectForm
              project={editingProject || undefined}
              artists={artists}
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

export default Projects;