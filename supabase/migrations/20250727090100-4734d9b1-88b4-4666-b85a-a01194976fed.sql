-- Fix function security by setting search_path
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
SET search_path = public
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