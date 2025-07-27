-- Only set REPLICA IDENTITY since table is already in realtime publication
ALTER TABLE public.generation_jobs REPLICA IDENTITY FULL;