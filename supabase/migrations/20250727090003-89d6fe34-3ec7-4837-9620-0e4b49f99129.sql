-- Add is_draft and parent_draft_id columns to tracks table
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_draft_id UUID REFERENCES public.tracks(id);

-- Create index for better performance on draft queries
CREATE INDEX IF NOT EXISTS idx_tracks_is_draft ON public.tracks(is_draft);
CREATE INDEX IF NOT EXISTS idx_tracks_parent_draft_id ON public.tracks(parent_draft_id);

-- Update RLS policies to handle draft system
CREATE POLICY "Users can view drafts they own" ON public.tracks
FOR SELECT
USING (auth.uid() = user_id AND is_draft = true);

-- Create function to get track hierarchy
CREATE OR REPLACE FUNCTION public.get_track_variations(track_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    is_draft BOOLEAN,
    parent_draft_id UUID,
    variation_type TEXT,
    created_at TIMESTAMPTZ
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT 
        t.id,
        t.title,
        t.is_draft,
        t.parent_draft_id,
        COALESCE(tv.variation_type, 'original') as variation_type,
        t.created_at
    FROM tracks t
    LEFT JOIN track_variations tv ON (tv.child_track_id = t.id OR tv.parent_track_id = t.id)
    WHERE t.id = track_id 
       OR t.parent_draft_id = track_id
       OR tv.parent_track_id = track_id
       OR tv.child_track_id = track_id
    ORDER BY t.created_at ASC;
$$;