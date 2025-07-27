-- Create storage bucket for tracks if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tracks', 
  'tracks', 
  true, 
  52428800, -- 50MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/aac', 'audio/mp3']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for track storage
DROP POLICY IF EXISTS "Users can view their own tracks" ON storage.objects;
CREATE POLICY "Users can view their own tracks" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own tracks" ON storage.objects;
CREATE POLICY "Users can upload their own tracks" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own tracks" ON storage.objects;
CREATE POLICY "Users can update their own tracks" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own tracks" ON storage.objects;
CREATE POLICY "Users can delete their own tracks" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'tracks' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public access policy for track downloads (optional - enables direct links)
DROP POLICY IF EXISTS "Public track access for downloads" ON storage.objects;
CREATE POLICY "Public track access for downloads" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'tracks');