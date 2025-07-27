-- Create track_variations table for parent-child track relationships
CREATE TABLE public.track_variations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  child_track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  variation_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'auto_improve', 'style_change', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure no circular references and unique parent-child pairs
  CONSTRAINT track_variations_no_self_reference CHECK (parent_track_id != child_track_id),
  CONSTRAINT track_variations_unique_pair UNIQUE (parent_track_id, child_track_id)
);

-- Enable RLS
ALTER TABLE public.track_variations ENABLE ROW LEVEL SECURITY;

-- Create policies for track_variations
CREATE POLICY "Users can view track variations for their tracks" 
ON public.track_variations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_variations.parent_track_id 
    AND tracks.user_id = auth.uid()
  ) OR 
  EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_variations.child_track_id 
    AND tracks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create track variations for their tracks" 
ON public.track_variations 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_variations.parent_track_id 
    AND tracks.user_id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_variations.child_track_id 
    AND tracks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update track variations for their tracks" 
ON public.track_variations 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_variations.parent_track_id 
    AND tracks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete track variations for their tracks" 
ON public.track_variations 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.tracks 
    WHERE tracks.id = track_variations.parent_track_id 
    AND tracks.user_id = auth.uid()
  )
);

-- Add trigger for updating updated_at
CREATE TRIGGER update_track_variations_updated_at
BEFORE UPDATE ON public.track_variations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_track_variations_parent ON public.track_variations(parent_track_id);
CREATE INDEX idx_track_variations_child ON public.track_variations(child_track_id);
CREATE INDEX idx_track_variations_type ON public.track_variations(variation_type);

-- Add is_draft field to tracks table to identify parent drafts
ALTER TABLE public.tracks 
ADD COLUMN is_draft BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN parent_draft_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL;