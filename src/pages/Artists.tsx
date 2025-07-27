import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Plus, Search } from 'lucide-react';
import { ArtistForm } from '@/components/artists/ArtistForm';
import { ArtistCard } from '@/components/artists/ArtistCard';
import { ProjectForm } from '@/components/projects/ProjectForm';
import { useArtists } from '@/hooks/useArtists';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/components/auth/AuthProvider';
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
    // Navigate to projects page filtered by artist
    console.log('View projects for artist:', artist.name);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">Войдите в систему</h2>
            <p className="text-muted-foreground">
              Для управления артистами и проектами необходимо войти в систему.
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
              <Users className="h-8 w-8" />
              Артисты и группы
            </h1>
            <p className="text-muted-foreground mt-2">
              Управляйте своими артистами и создавайте музыкальные проекты
            </p>
          </div>
          <Button onClick={handleCreateArtist} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Добавить артиста
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск артистов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Artists Grid */}
      {isLoading ? (
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
      ) : filteredArtists.length === 0 ? (
        <Card className="text-center p-12">
          <CardContent>
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'Артисты не найдены' : 'Нет артистов'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? 'Попробуйте изменить поисковый запрос' 
                : 'Создайте своего первого артиста или группу'
              }
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateArtist}>
                Создать артиста
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.map((artist) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              projectCount={getProjectCountForArtist(artist.id)}
              onEdit={handleEditArtist}
              onDelete={deleteArtist}
              onCreateProject={handleCreateProject}
              onViewProjects={handleViewProjects}
            />
          ))}
        </div>
      )}

      {/* Artist Form Dialog */}
      <Dialog open={artistFormOpen} onOpenChange={setArtistFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingArtist ? 'Редактировать артиста' : 'Создать артиста'}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать проект</DialogTitle>
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
  );
};