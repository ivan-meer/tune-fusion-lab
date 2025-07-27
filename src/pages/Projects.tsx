import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Plus, Search, Filter } from 'lucide-react';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { useArtists } from '@/hooks/useArtists';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/components/auth/AuthProvider';
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
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">Войдите в систему</h2>
            <p className="text-muted-foreground">
              Для управления проектами необходимо войти в систему.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Music className="h-8 w-8" />
              Музыкальные проекты
            </h1>
            <p className="text-muted-foreground mt-2">
              Управляйте своими музыкальными проектами и треками
            </p>
          </div>
          <Button 
            onClick={handleCreateProject} 
            className="flex items-center gap-2"
            disabled={artists.length === 0}
          >
            <Plus className="h-4 w-4" />
            Создать проект
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск проектов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все артисты</SelectItem>
              {artists.map((artist) => (
                <SelectItem key={artist.id} value={artist.id}>
                  {artist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      {artists.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Сначала создайте артиста</h3>
            <p className="text-muted-foreground mb-6">
              Для создания проектов вам нужно сначала создать артиста или группу.
            </p>
            <Button onClick={() => window.location.href = '/artists'}>
              Создать артиста
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-16 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <Music className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery || typeFilter !== 'all' || artistFilter !== 'all' 
                ? 'Проекты не найдены' 
                : 'Нет проектов'
              }
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || typeFilter !== 'all' || artistFilter !== 'all'
                ? 'Попробуйте изменить фильтры или поисковый запрос' 
                : 'Создайте свой первый музыкальный проект'
              }
            </p>
            {!searchQuery && typeFilter === 'all' && artistFilter === 'all' && (
              <Button onClick={handleCreateProject}>
                Создать проект
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              trackCount={0} // TODO: Get actual track count
              onEdit={handleEditProject}
              onDelete={deleteProject}
              onAddTrack={handleAddTrack}
              onViewTracks={handleViewTracks}
            />
          ))}
        </div>
      )}

      {/* Project Form Dialog */}
      <Dialog open={projectFormOpen} onOpenChange={setProjectFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Редактировать проект' : 'Создать проект'}
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
  );
};

export default Projects;