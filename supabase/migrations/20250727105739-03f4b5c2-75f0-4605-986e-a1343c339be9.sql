-- Add database indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_user_id_created_at ON tracks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracks_provider ON tracks(provider);
CREATE INDEX IF NOT EXISTS idx_tracks_genre ON tracks(genre);
CREATE INDEX IF NOT EXISTS idx_tracks_is_public ON tracks(is_public);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id_status ON generation_jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status_created_at ON generation_jobs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_track_likes_user_id ON track_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_track_likes_track_id ON track_likes(track_id);

-- Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
DROP TRIGGER IF EXISTS update_tracks_updated_at ON tracks;
CREATE TRIGGER update_tracks_updated_at
    BEFORE UPDATE ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_generation_jobs_updated_at ON generation_jobs;
CREATE TRIGGER update_generation_jobs_updated_at
    BEFORE UPDATE ON generation_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();