-- Add model field to generation_jobs table
ALTER TABLE public.generation_jobs 
ADD COLUMN model text;

-- Add check constraint for valid models
ALTER TABLE public.generation_jobs 
ADD CONSTRAINT generation_jobs_model_check 
CHECK (model IN ('suno-v3.5', 'suno-v4', 'mureka-v6', 'mureka-o1', 'test'));

-- Create table for API health monitoring
CREATE TABLE public.api_health_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider text NOT NULL,
  model text,
  status text NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time integer, -- in ms
  error_message text,
  checked_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on api_health_logs
ALTER TABLE public.api_health_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view health logs
CREATE POLICY "Authenticated users can view API health logs" 
ON public.api_health_logs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow system to insert health logs
CREATE POLICY "System can insert health logs" 
ON public.api_health_logs 
FOR INSERT 
WITH CHECK (true);

-- Add index for fast queries
CREATE INDEX idx_api_health_logs_provider_checked_at 
ON public.api_health_logs(provider, checked_at DESC);

CREATE INDEX idx_generation_jobs_user_created_at 
ON public.generation_jobs(user_id, created_at DESC);