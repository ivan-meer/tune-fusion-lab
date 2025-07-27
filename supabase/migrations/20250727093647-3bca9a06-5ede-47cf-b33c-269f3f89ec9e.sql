-- Fix security issue: Set search_path for the function
CREATE OR REPLACE FUNCTION cleanup_stuck_generation_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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