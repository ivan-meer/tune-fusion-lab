-- Удаляем старое ограничение модели
ALTER TABLE generation_jobs DROP CONSTRAINT generation_jobs_model_check;

-- Добавляем новое ограничение с правильными моделями Suno API
ALTER TABLE generation_jobs ADD CONSTRAINT generation_jobs_model_check 
CHECK (model = ANY (ARRAY['V4_5', 'V4', 'V3_5', 'mureka-v6', 'mureka-o1', 'test']));