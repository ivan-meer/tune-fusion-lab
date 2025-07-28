-- Fix duration column type to handle decimal values
ALTER TABLE tracks ALTER COLUMN duration TYPE NUMERIC;

-- Clean up stuck generation jobs
UPDATE generation_jobs 
SET 
    status = 'failed',
    error_message = 'Generation timed out (cleaned up)',
    updated_at = NOW(),
    progress = 0
WHERE 
    status = 'processing' 
    AND updated_at < (NOW() - INTERVAL '15 minutes');

-- Also clean up very old pending jobs
UPDATE generation_jobs 
SET 
    status = 'failed',
    error_message = 'Generation timed out (pending too long)',
    updated_at = NOW(),
    progress = 0
WHERE 
    status = 'pending' 
    AND created_at < (NOW() - INTERVAL '30 minutes');