/**
 * Hook for generating helpful status text during music generation
 */

import { GenerationJob } from './useMusicGeneration';

export function getGenerationStatusText(job: GenerationJob): string | undefined {
  if (!job) return undefined;

  const { status, progress } = job;

  if (status === 'pending') {
    return 'Подключение к ИИ-сервису...';
  }

  if (status === 'processing') {
    if (progress < 20) {
      return 'Анализ запроса с помощью ИИ-провайдера...';
    } else if (progress < 40) {
      return 'Генерация музыкальной структуры...';
    } else if (progress < 60) {
      return 'Создание аранжировки и инструментов...';
    } else if (progress < 80) {
      return 'Обработка аудио и применение эффектов...';
    } else {
      return 'Финализация трека и проверка качества...';
    }
  }

  if (status === 'completed') {
    return '🎉 Трек готов! Можете прослушать результат.';
  }

  if (status === 'failed') {
    return '❌ Возникла ошибка. Попробуйте изменить описание или выбрать другого провайдера.';
  }

  return undefined;
}