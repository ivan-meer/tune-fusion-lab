# Suno API Integration Guide

## Обзор интеграции

AI Music Studio интегрирован с Suno AI API для генерации музыки и лирики. Эта документация описывает ключевые аспекты интеграции и решение известных проблем.

## 🎵 Генерация музыки

### Эндпоинт
```
POST https://api.sunoapi.org/api/v1/generate
```

### Параметры
```typescript
interface MusicGenerationRequest {
  prompt: string;           // Описание музыки
  model?: string;           // V4, V4_5 (по умолчанию)
  style?: string;           // Жанр/стиль
  title?: string;           // Название трека
  lyrics?: string;          // Собственные слова
  instrumental?: boolean;   // Инструментальная версия
  wait_audio?: boolean;     // Ожидать готовый аудио (default: false)
}
```

### Обработка ответа
```typescript
// Асинхронная генерация (wait_audio: false)
const response = {
  taskId: "string",
  status: "pending"
};

// Синхронная генерация (wait_audio: true)
const response = {
  taskId: "string", 
  status: "complete",
  audioData: [{
    audio_url: "https://...",
    video_url: "https://...",
    title: "Generated Title",
    lyrics: "Generated lyrics...",
    duration: 120
  }]
};
```

## ✍️ Генерация лирики

### Эндпоинт
```
POST https://api.sunoapi.org/api/v1/generate
```

### Особенности лирики
**ВАЖНО**: Для генерации только лирики используется тот же эндпоинт `/api/v1/generate` с параметром `wait_audio: false`.

### Параметры
```typescript
interface LyricsGenerationRequest {
  prompt: string;           // Тема песни
  style?: string;           // Музыкальный стиль
  language?: string;        // Язык (по умолчанию: "russian")
  wait_audio: false;        // Обязательно false для лирики
}
```

### Извлечение лирики из ответа
```typescript
// В callback функции правильное извлечение:
const extractLyrics = (callbackData) => {
  // Приоритет извлечения данных:
  // 1. lyricsData[0].text - правильная лирика
  // 2. result - может содержать промпт
  // 3. audioData[0].lyrics - для музыки с лирикой
  
  if (callbackData.lyricsData?.[0]?.text) {
    const lyrics = callbackData.lyricsData[0].text;
    
    // Проверка, что это лирика, а не промпт
    if (lyrics.includes('[Verse]') || 
        lyrics.includes('[Chorus]') || 
        lyrics.includes('\n')) {
      return lyrics;
    }
  }
  
  // Fallback для других форматов
  return callbackData.result || callbackData.audioData?.[0]?.lyrics;
};
```

## 🔄 Callback обработка

### Webhook URL
```
POST https://your-domain.com/functions/v1/suno-callback
```

### Структура callback для лирики
```typescript
interface SunoLyricsCallback {
  taskId: string;
  status: "complete" | "processing" | "failed";
  lyricsData?: [{
    text: string;           // РЕАЛЬНАЯ ЛИРИКА здесь
    title: string;
    status: "complete";
    errorMessage: "";
  }];
  result?: string;          // Может содержать промпт
  error?: string;
}
```

### Структура callback для музыки
```typescript
interface SunoMusicCallback {
  taskId: string;
  status: "complete" | "processing" | "failed";
  audioData?: [{
    audio_url: string;
    video_url?: string;
    title: string;
    lyrics?: string;        // Лирика для музыки
    duration: number;
  }];
  error?: string;
}
```

## 🐛 Устранение проблем

### Проблема: Лирика возвращает промпт

**Симптомы:**
- Вместо стихов возвращается исходный запрос
- Отсутствуют теги [Verse], [Chorus]
- Текст выглядит как описание, а не песня

**Причина:**
Неправильное извлечение данных из поля `result` вместо `lyricsData[0].text`

**Решение:**
```typescript
// ❌ НЕПРАВИЛЬНО
const lyrics = callbackData.result;

// ✅ ПРАВИЛЬНО  
const lyrics = callbackData.lyricsData?.[0]?.text;

// ✅ С ВАЛИДАЦИЕЙ
const extractLyrics = (callbackData) => {
  const lyrics = callbackData.lyricsData?.[0]?.text;
  
  if (lyrics && (
    lyrics.includes('[Verse]') || 
    lyrics.includes('[Chorus]') ||
    lyrics.split('\n').length > 3
  )) {
    return lyrics;
  }
  
  console.warn('Extracted text might be a prompt, not lyrics:', lyrics);
  return lyrics; // Возвращаем, но с предупреждением
};
```

### Проблема: Застрявшие задачи

**Симптомы:**
- Задачи не завершаются более 15 минут
- Статус остается "processing"

**Решение:**
Используется автоматическая очистка через функцию `cleanup-stuck-tasks`:

```typescript
// Вызов очистки
const { data } = await supabase.functions.invoke('cleanup-stuck-tasks');
console.log(`Cleaned up ${data.count} stuck tasks`);
```

### Проблема: Неверные API ключи

**Симптомы:**
- 401/403 ошибки от Suno API
- "Invalid API key" в логах

**Решение:**
1. Проверьте ключ в Supabase Dashboard → Settings → Edge Functions
2. Убедитесь, что используется правильный формат: `Bearer YOUR_API_KEY`
3. Проверьте лимиты API на Suno API Dashboard

## 📊 Мониторинг и отладка

### Логирование
Все Edge Functions содержат подробное логирование:

```typescript
console.log('Suno API Request:', {
  endpoint: url,
  method: 'POST',
  headers: { 'Authorization': 'Bearer ***' },
  body: requestBody
});

console.log('Suno API Response:', {
  status: response.status,
  data: responseData
});
```

### Проверка статуса задач
```typescript
// Проверка через API
const status = await supabase.functions.invoke('get-generation-status', {
  body: { jobId: 'task-id' }
});

// Мониторинг через GenerationMonitor компонент
import { GenerationMonitor } from '@/components/music/GenerationMonitor';
```

### Отладочные эндпоинты
```typescript
// Проверка соединения
const health = await supabase.functions.invoke('check-api-health');

// Проверка кредитов
const credits = await supabase.functions.invoke('check-credits');

// Тест аутентификации
const auth = await supabase.functions.invoke('test-auth');
```

## 🚀 Рекомендации по использованию

### Для лирики
1. Используйте описательные промпты
2. Указывайте язык в запросе
3. Добавляйте стилистические указания
4. Проверяйте результат на валидность

### Для музыки
1. Детализируйте промпт (инструменты, настроение, темп)
2. Используйте модель V4_5 для лучшего качества
3. Устанавливайте разумную длительность (30-180 сек)
4. Для инструментальной музыки укажите `instrumental: true`

### Для production
1. Настройте автоматическую очистку застрявших задач
2. Мониторьте лимиты API
3. Реализуйте retry логику для failed задач
4. Используйте rate limiting для защиты от злоупотреблений

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи Edge Functions в Supabase Dashboard
2. Используйте компонент GenerationMonitor для диагностики
3. Обратитесь к документации Suno API: https://docs.sunoapi.org
4. Создайте issue в репозитории проекта с подробным описанием проблемы

## 🔄 История изменений

### v0.4.1 - Исправления лирики
- ✅ Исправлен эндпоинт генерации лирики
- ✅ Правильное извлечение из `lyricsData[0].text`
- ✅ Добавлена валидация результатов
- ✅ Улучшено логирование и отладка

### v0.4.0 - Мониторинг и очистка
- ✅ Автоматическая очистка застрявших задач
- ✅ Система мониторинга производительности
- ✅ Улучшенная обработка ошибок
- ✅ Комплексная документация