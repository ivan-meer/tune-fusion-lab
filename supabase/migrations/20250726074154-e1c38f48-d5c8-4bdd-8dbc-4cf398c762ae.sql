-- Fix the provider check constraint on tracks table to allow "test" provider
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_provider_check;

-- Add new constraint with correct providers for tracks
ALTER TABLE tracks ADD CONSTRAINT tracks_provider_check 
  CHECK (provider IN ('suno', 'mureka', 'test'));