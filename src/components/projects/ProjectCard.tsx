import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Music, MoreVertical, Edit, Trash2, Plus, Eye } from 'lucide-react';
import type { Project } from '@/types/artist';
import { PROJECT_TYPES } from '@/types/artist';

interface ProjectCardProps {
  project: Project;
  trackCount?: number;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onAddTrack: (project: Project) => void;
  onViewTracks: (project: Project) => void;
}

export const ProjectCard = ({ 
  project, 
  trackCount = 0, 
  onEdit, 
  onDelete, 
  onAddTrack,
  onViewTracks 
}: ProjectCardProps) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'album': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'ep': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'single': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'teaser': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {project.cover_url ? (
              <img 
                src={project.cover_url} 
                alt={project.name}
                className="w-12 h-12 object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                <Music className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{project.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={getTypeColor(project.type)}>
                  {PROJECT_TYPES[project.type]}
                </Badge>
                {project.artist && (
                  <span className="text-sm text-muted-foreground">
                    {project.artist.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewTracks(project)}>
                <Eye className="h-4 w-4 mr-2" />
                Треки
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddTrack(project)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить трек
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(project.id)}
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
        {project.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {project.description}
          </p>
        )}
        
        {project.concept && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
            <strong>Концепция:</strong> {project.concept}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Music className="h-4 w-4" />
            <span>{trackCount} треков</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onViewTracks(project)}
          >
            Открыть
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};