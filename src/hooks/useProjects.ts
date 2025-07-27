import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { Project, ProjectTrack } from '@/types/artist';
import type { Track } from '@/types/music';

export const useProjects = (artistId?: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadProjects = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('projects')
        .select(`
          *,
          artists!inner(*)
        `)
        .eq('user_id', user.id);

      if (artistId) {
        query = query.eq('artist_id', artistId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setProjects((data || []) as Project[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки проектов';
      setError(message);
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (projectData: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          user_id: user.id,
        }])
        .select(`
          *,
          artists(*)
        `)
        .single();

      if (error) throw error;

      setProjects(prev => [data as Project, ...prev]);
      toast({
        title: 'Успешно',
        description: 'Проект создан',
      });
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка создания проекта';
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          artists(*)
        `)
        .single();

      if (error) throw error;

      setProjects(prev => prev.map(project => project.id === id ? data as Project : project));
      toast({
        title: 'Успешно',
        description: 'Проект обновлен',
      });
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка обновления проекта';
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(project => project.id !== id));
      toast({
        title: 'Успешно',
        description: 'Проект удален',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка удаления проекта';
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const addTrackToProject = async (projectId: string, trackId: string) => {
    try {
      // Get current max position
      const { data: existingTracks } = await supabase
        .from('project_tracks')
        .select('position')
        .eq('project_id', projectId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingTracks && existingTracks.length > 0 ? existingTracks[0].position + 1 : 1;

      const { error } = await supabase
        .from('project_tracks')
        .insert([{
          project_id: projectId,
          track_id: trackId,
          position: nextPosition,
        }]);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Трек добавлен в проект',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка добавления трека';
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const removeTrackFromProject = async (projectId: string, trackId: string) => {
    try {
      const { error } = await supabase
        .from('project_tracks')
        .delete()
        .eq('project_id', projectId)
        .eq('track_id', trackId);

      if (error) throw error;

      toast({
        title: 'Успешно',
        description: 'Трек удален из проекта',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка удаления трека';
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const getProjectTracks = async (projectId: string): Promise<Track[]> => {
    try {
      const { data, error } = await supabase
        .from('project_tracks')
        .select(`
          position,
          track_id,
          tracks!inner(*)
        `)
        .eq('project_id', projectId)
        .order('position');

      if (error) throw error;
      
      return data?.map(pt => (pt as any).tracks as Track) || [];
    } catch (err) {
      console.error('Error loading project tracks:', err);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user, artistId]);

  return {
    projects,
    isLoading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    addTrackToProject,
    removeTrackFromProject,
    getProjectTracks,
  };
};