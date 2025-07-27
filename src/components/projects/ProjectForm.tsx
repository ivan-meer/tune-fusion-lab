import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Music } from 'lucide-react';
import type { Project } from '@/types/artist';
import { PROJECT_TYPES } from '@/types/artist';
import type { Artist } from '@/types/artist';

interface ProjectFormProps {
  project?: Project;
  artists: Artist[];
  preselectedArtistId?: string;
  onSubmit: (data: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ProjectForm = ({ 
  project, 
  artists, 
  preselectedArtistId,
  onSubmit, 
  onCancel, 
  isSubmitting 
}: ProjectFormProps) => {
  const [formData, setFormData] = useState({
    artist_id: project?.artist_id || preselectedArtistId || '',
    name: project?.name || '',
    type: project?.type || 'single' as const,
    description: project?.description || '',
    concept: project?.concept || '',
    style: project?.style || '',
    cover_url: project?.cover_url || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          {project ? 'Редактировать проект' : 'Создать проект'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Artist Selection */}
          <div>
            <Label htmlFor="artist">Артист *</Label>
            <Select
              value={formData.artist_id}
              onValueChange={(value) => handleInputChange('artist_id', value)}
              required
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Выберите артиста" />
              </SelectTrigger>
              <SelectContent>
                {artists.map((artist) => (
                  <SelectItem key={artist.id} value={artist.id}>
                    {artist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Name */}
          <div>
            <Label htmlFor="name">Название проекта *</Label>
            <Input
              id="name"
              placeholder="Введите название проекта"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {/* Project Type */}
          <div>
            <Label htmlFor="type">Тип проекта *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
              required
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROJECT_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cover Image */}
          <div>
            <Label htmlFor="cover_url">Обложка (URL)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="cover_url"
                type="url"
                placeholder="https://example.com/cover.jpg"
                value={formData.cover_url}
                onChange={(e) => handleInputChange('cover_url', e.target.value)}
              />
              <Button type="button" variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {formData.cover_url && (
              <div className="mt-2">
                <img 
                  src={formData.cover_url} 
                  alt="Preview" 
                  className="w-24 h-24 object-cover rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Краткое описание проекта"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Concept */}
          <div>
            <Label htmlFor="concept">Концепция</Label>
            <Textarea
              id="concept"
              placeholder="Опишите концепцию и идею проекта"
              value={formData.concept}
              onChange={(e) => handleInputChange('concept', e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Style */}
          <div>
            <Label htmlFor="style">Стиль</Label>
            <Input
              id="style"
              placeholder="Например: Хип-хоп, Электроника, Поп"
              value={formData.style}
              onChange={(e) => handleInputChange('style', e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!formData.name.trim() || !formData.artist_id || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Сохранение...' : (project ? 'Обновить' : 'Создать')}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};