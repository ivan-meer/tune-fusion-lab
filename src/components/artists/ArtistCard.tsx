import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, Music, MoreVertical, Edit, Trash2, Plus } from 'lucide-react';
import type { Artist } from '@/types/artist';

interface ArtistCardProps {
  artist: Artist;
  projectCount?: number;
  onEdit: (artist: Artist) => void;
  onDelete: (id: string) => void;
  onCreateProject: (artist: Artist) => void;
  onViewProjects: (artist: Artist) => void;
}

export const ArtistCard = ({ 
  artist, 
  projectCount = 0, 
  onEdit, 
  onDelete, 
  onCreateProject,
  onViewProjects 
}: ArtistCardProps) => {
  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={artist.avatar_url} />
              <AvatarFallback>
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{artist.name}</h3>
              {artist.style && (
                <Badge variant="secondary" className="text-xs">
                  {artist.style}
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(artist)}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCreateProject(artist)}>
                <Plus className="h-4 w-4 mr-2" />
                Новый проект
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(artist.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {artist.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {artist.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Music className="h-4 w-4" />
            <span>{projectCount} проектов</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewProjects(artist)}
          >
            Проекты
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};