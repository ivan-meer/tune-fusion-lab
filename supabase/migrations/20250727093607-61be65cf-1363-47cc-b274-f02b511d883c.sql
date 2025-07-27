-- Add timeout handling for stuck generation jobs
-- Create a function to automatically clean up stuck jobs

-- Update the generation_jobs table if needed (this is idempotent)
ALTER TABLE generation_jobs 
ADD COLUMN IF NOT EXISTS timeout_at TIMESTAMP WITH TIME ZONE;

-- Create function to automatically timeout stuck jobs (fixed version)
CREATE OR REPLACE FUNCTION cleanup_stuck_generation_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    processing_count INTEGER;
    pending_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Update stuck processing jobs (older than 15 minutes)
    WITH updated_processing AS (
        UPDATE generation_jobs 
        SET 
            status = 'failed',
            error_message = 'Generation timed out automatically',
            updated_at = NOW(),
            progress = 0
        WHERE 
            status = 'processing' 
            AND updated_at < (NOW() - INTERVAL '15 minutes')
        RETURNING id
    )
    SELECT COUNT(*) INTO processing_count FROM updated_processing;
    
    -- Update stuck pending jobs (older than 30 minutes)
    WITH updated_pending AS (
        UPDATE generation_jobs 
        SET 
            status = 'failed',
            error_message = 'Generation timed out (pending too long)',
            updated_at = NOW(),
            progress = 0
        WHERE 
            status = 'pending' 
            AND created_at < (NOW() - INTERVAL '30 minutes')
        RETURNING id
    )
    SELECT COUNT(*) INTO pending_count FROM updated_pending;
    
    total_count := processing_count + pending_count;
    
    RETURN total_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_stuck_generation_jobs() TO authenticated;

-- Create an index for better performance on timeout queries
CREATE INDEX IF NOT EXISTS idx_generation_jobs_timeout 
ON generation_jobs (status, updated_at, created_at);