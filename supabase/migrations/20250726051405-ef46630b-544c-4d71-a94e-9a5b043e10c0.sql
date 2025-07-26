-- Create tracks table for music generation
CREATE TABLE public.tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER, -- duration in seconds
  file_url TEXT,
  file_path TEXT,
  file_size INTEGER,
  audio_format TEXT DEFAULT 'mp3',
  artwork_url TEXT,
  genre TEXT,
  mood TEXT,
  bpm INTEGER,
  key_signature TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_commercial BOOLEAN NOT NULL DEFAULT false,
  provider TEXT NOT NULL CHECK (provider IN ('mureka', 'suno', 'hybrid')),
  provider_track_id TEXT,
  generation_params JSONB,
  lyrics TEXT,
  tags TEXT[],
  play_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  track_count INTEGER NOT NULL DEFAULT 0,
  total_duration INTEGER NOT NULL DEFAULT 0, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist_tracks junction table
CREATE TABLE public.playlist_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, track_id),
  UNIQUE(playlist_id, position)
);

-- Create generation_jobs table to track AI generation requests
CREATE TABLE public.generation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('mureka', 'suno')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  request_params JSONB NOT NULL,
  response_data JSONB,
  error_message TEXT,
  credits_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table for track likes
CREATE TABLE public.track_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

-- Enable Row Level Security
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for tracks
CREATE POLICY "Users can view their own tracks" ON public.tracks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public tracks" ON public.tracks
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own tracks" ON public.tracks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks" ON public.tracks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks" ON public.tracks
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for playlists
CREATE POLICY "Users can view their own playlists" ON public.playlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public playlists" ON public.playlists
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own playlists" ON public.playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" ON public.playlists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists" ON public.playlists
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS Policies for playlist_tracks
CREATE POLICY "Users can manage tracks in their playlists" ON public.playlist_tracks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.playlists 
      WHERE playlists.id = playlist_tracks.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- Create RLS Policies for generation_jobs
CREATE POLICY "Users can view their own generation jobs" ON public.generation_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generation jobs" ON public.generation_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generation jobs" ON public.generation_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS Policies for track_likes
CREATE POLICY "Users can view all track likes" ON public.track_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own likes" ON public.track_likes
  FOR ALL USING (auth.uid() = user_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_tracks_user_id ON public.tracks(user_id);
CREATE INDEX idx_tracks_created_at ON public.tracks(created_at DESC);
CREATE INDEX idx_tracks_is_public ON public.tracks(is_public);
CREATE INDEX idx_tracks_provider ON public.tracks(provider);
CREATE INDEX idx_tracks_tags ON public.tracks USING GIN(tags);

CREATE INDEX idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX idx_playlists_created_at ON public.playlists(created_at DESC);

CREATE INDEX idx_generation_jobs_user_id ON public.generation_jobs(user_id);
CREATE INDEX idx_generation_jobs_status ON public.generation_jobs(status);
CREATE INDEX idx_generation_jobs_created_at ON public.generation_jobs(created_at DESC);