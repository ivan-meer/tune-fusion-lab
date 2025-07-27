export interface Artist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  style?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  artist_id: string;
  user_id: string;
  name: string;
  type: 'teaser' | 'single' | 'ep' | 'album';
  description?: string;
  concept?: string;
  style?: string;
  cover_url?: string;
  created_at: string;
  updated_at: string;
  artist?: Artist;
  track_count?: number;
}

export interface ProjectTrack {
  id: string;
  project_id: string;
  track_id: string;
  position: number;
  added_at: string;
}

export const PROJECT_TYPES = {
  teaser: 'Тизер',
  single: 'Сингл',
  ep: 'EP',
  album: 'Альбом'
} as const;