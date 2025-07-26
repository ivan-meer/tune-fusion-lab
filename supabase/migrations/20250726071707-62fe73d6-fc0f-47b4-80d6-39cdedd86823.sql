-- Update the model check constraint to allow chirp models
ALTER TABLE generation_jobs DROP CONSTRAINT IF EXISTS generation_jobs_model_check;

-- Add new constraint for chirp models
ALTER TABLE generation_jobs ADD CONSTRAINT generation_jobs_model_check 
  CHECK (model IN ('chirp-v4', 'chirp-v3.5', 'chirp-v3', 'mureka-v6', 'mureka-o1', 'test-model'));