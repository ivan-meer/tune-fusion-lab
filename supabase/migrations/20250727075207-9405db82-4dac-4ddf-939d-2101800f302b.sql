-- Enable realtime for generation_jobs table
ALTER TABLE public.generation_jobs REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER publication supabase_realtime ADD TABLE public.generation_jobs;