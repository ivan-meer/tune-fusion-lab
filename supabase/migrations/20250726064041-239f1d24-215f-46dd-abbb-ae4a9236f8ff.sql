-- Enable realtime for tracks table
ALTER TABLE tracks REPLICA IDENTITY FULL;

-- Add tracks table to supabase_realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE tracks;

-- Enable realtime for generation_jobs table
ALTER TABLE generation_jobs REPLICA IDENTITY FULL;

-- Add generation_jobs table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE generation_jobs;