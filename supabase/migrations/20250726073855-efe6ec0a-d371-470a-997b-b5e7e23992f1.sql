-- Fix the provider check constraint to allow "test" provider
ALTER TABLE generation_jobs DROP CONSTRAINT IF EXISTS generation_jobs_provider_check;

-- Add new constraint with correct providers
ALTER TABLE generation_jobs ADD CONSTRAINT generation_jobs_provider_check 
  CHECK (provider IN ('suno', 'mureka', 'test'));