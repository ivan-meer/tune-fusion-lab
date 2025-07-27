import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User } from 'lucide-react';
import type { Artist } from '@/types/artist';

interface ArtistFormProps {
  artist?: Artist;
  onSubmit: (data: Omit<Artist, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ArtistForm = ({ artist, onSubmit, onCancel, isSubmitting }: ArtistFormProps) => {
  const [formData, setFormData] = useState({
    name: artist?.name || '',
    description: artist?.description || '',
    style: artist?.style || '',
    avatar_url: artist?.avatar_url || '',
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
          <User className="h-5 w-5" />
          {artist ? 'Редактировать артиста' : 'Создать артиста'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.avatar_url} />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div className="w-full">
              <Label htmlFor="avatar_url">Аватар (URL)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="avatar_url"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={formData.avatar_url}
                  onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                />
                <Button type="button" variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Название артиста/группы *</Label>
            <Input
              id="name"
              placeholder="Введите название"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {/* Style */}
          <div>
            <Label htmlFor="style">Стиль/Жанр</Label>
            <Input
              id="style"
              placeholder="Например: Хип-хоп, Электроника, Поп"
              value={formData.style}
              onChange={(e) => handleInputChange('style', e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              placeholder="Опишите артиста, его историю, стиль..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={!formData.name.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Сохранение...' : (artist ? 'Обновить' : 'Создать')}
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