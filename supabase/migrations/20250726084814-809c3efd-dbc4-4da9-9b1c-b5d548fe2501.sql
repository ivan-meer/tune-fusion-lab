-- Сначала обновляем все существующие записи с правильными моделями
UPDATE generation_jobs 
SET model = CASE 
  WHEN model = 'chirp-v4' THEN 'V4_5'
  WHEN model = 'chirp-v3.5' THEN 'V3_5' 
  WHEN model = 'chirp-v3' THEN 'V3_5'  -- V3 не поддерживается, обновляем до V3_5
  WHEN model IS NULL THEN 'V4_5'      -- NULL значения заменяем на V4_5
  ELSE model  -- test и другие остаются как есть
END;

-- Удаляем старое ограничение модели
ALTER TABLE generation_jobs DROP CONSTRAINT generation_jobs_model_check;

-- Добавляем новое ограничение с правильными моделями Suno API
ALTER TABLE generation_jobs ADD CONSTRAINT generation_jobs_model_check 
CHECK (model = ANY (ARRAY['V4_5', 'V4', 'V3_5', 'mureka-v6', 'mureka-o1', 'test']));