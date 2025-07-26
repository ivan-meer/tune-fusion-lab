-- Clean up stuck generation jobs
UPDATE generation_jobs 
SET status = 'failed', 
    error_message = 'Job timed out - cleaned up by system',
    updated_at = NOW()
WHERE status = 'processing' 
AND created_at < NOW() - INTERVAL '10 minutes';