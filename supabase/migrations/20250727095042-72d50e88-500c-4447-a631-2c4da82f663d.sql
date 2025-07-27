-- Create artists table
CREATE TABLE public.artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  style TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on artists
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for artists
CREATE POLICY "Users can view their own artists" 
ON public.artists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own artists" 
ON public.artists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artists" 
ON public.artists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artists" 
ON public.artists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('teaser', 'single', 'ep', 'album')),
  description TEXT,
  concept TEXT,
  style TEXT,
  cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create project_tracks table for linking tracks to projects
CREATE TABLE public.project_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  track_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, track_id)
);

-- Enable RLS on project_tracks
ALTER TABLE public.project_tracks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_tracks
CREATE POLICY "Users can manage tracks in their projects" 
ON public.project_tracks 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = project_tracks.project_id 
  AND projects.user_id = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_artists_updated_at
BEFORE UPDATE ON public.artists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();