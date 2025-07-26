-- Create lyrics table
CREATE TABLE public.lyrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  prompt TEXT NOT NULL,
  style TEXT,
  language TEXT DEFAULT 'russian',
  provider TEXT NOT NULL DEFAULT 'suno',
  provider_lyrics_id TEXT,
  generation_params JSONB,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.lyrics ENABLE ROW LEVEL SECURITY;

-- Create policies for lyrics
CREATE POLICY "Users can view their own lyrics" 
ON public.lyrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view public lyrics" 
ON public.lyrics 
FOR SELECT 
USING (is_public = true);

CREATE POLICY "Users can create their own lyrics" 
ON public.lyrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lyrics" 
ON public.lyrics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lyrics" 
ON public.lyrics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_lyrics_updated_at
BEFORE UPDATE ON public.lyrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();