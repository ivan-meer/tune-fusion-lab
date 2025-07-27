import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import type { Artist } from '@/types/artist';

export const useArtists = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadArtists = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArtists(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка загрузки артистов';
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

  const createArtist = async (artistData: Omit<Artist, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('artists')
        .insert([{
          ...artistData,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      setArtists(prev => [data, ...prev]);
      toast({
        title: 'Успешно',
        description: 'Артист создан',
      });
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка создания артиста';
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateArtist = async (id: string, updates: Partial<Artist>) => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setArtists(prev => prev.map(artist => artist.id === id ? data : artist));
      toast({
        title: 'Успешно',
        description: 'Артист обновлен',
      });
      
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка обновления артиста';
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteArtist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setArtists(prev => prev.filter(artist => artist.id !== id));
      toast({
        title: 'Успешно',
        description: 'Артист удален',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка удаления артиста';
      toast({
        title: 'Ошибка',
        description: message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user) {
      loadArtists();
    }
  }, [user]);

  return {
    artists,
    isLoading,
    error,
    loadArtists,
    createArtist,
    updateArtist,
    deleteArtist,
  };
};