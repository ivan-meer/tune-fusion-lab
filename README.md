# 🎵 AI Music Studio

[![Version](https://img.shields.io/badge/version-v2.1.0-blue.svg)](https://github.com/your-repo/ai-music-studio)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178c6.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.52.1-3ecf8e.svg)](https://supabase.io/)

> 🎼 Мощная платформа для создания музыки с помощью искусственного интеллекта. Поддерживает множественных провайдеров ИИ, включая Suno API v1 и Mureka, с полной интеграцией в Supabase.

## ✨ Основные возможности

### 🎼 Генерация музыки ИИ
- **Suno API v1**: Поддержка моделей V3.5, V4, V4.5 с корректными параметрами
- **Правильная реализация Custom Mode**: Соответствие официальной документации
- **Rate Limiting**: Обработка лимита 20 запросов за 10 секунд
- **Улучшенная обработка ошибок**: Специальные сообщения для всех HTTP кодов

### 📝 Генерация лирики
- **Suno Lyrics API**: Интеграция с `/api/v1/lyrics/generate`
- **Мультиязычность**: Поддержка русского и других языков
- **Правильное извлечение**: Лирика из `lyricsData[0].text`

### 📱 Адаптивный интерфейс
- **Mobile-First дизайн**: Полная адаптация для экранов от 320px
- **Responsive компоненты**: `grid-cols-1 sm:grid-cols-2` паттерны  
- **Динамические размеры**: `text-xs sm:text-sm` типографика
- **Оптимизированные кнопки**: `h-10 sm:h-12` для touch-friendly интерфейса

### 🔄 Real-time обновления
- **WebSocket соединения**: Живое отслеживание прогресса через Supabase Realtime
- **Автоматическая очистка**: Зависшие задачи очищаются через 15-30 минут
- **Мониторинг системы**: Компонент `GenerationMonitor` для отслеживания

### 💾 Управление данными
- **Облачное хранение**: Supabase Storage для аудиофайлов
- **PostgreSQL**: Исправлен тип `duration` с integer на NUMERIC
- **RLS политики**: Row Level Security для защиты данных
- **Автоматические индексы**: Оптимизация производительности

## 🚀 Технологический стек

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Edge Functions, Storage, Auth)  
- **AI APIs**: Suno API v1, Mureka API
- **Real-time**: Supabase Realtime для live обновлений
- **UI Components**: Radix UI, shadcn/ui
- **Build**: Vite, ESLint, TypeScript

## 🔧 Последние критические исправления (v2.1.0)

### ✅ Suno API v1 соответствие
- **Корректные параметры**: Приведены в соответствие с документацией
- **Custom Mode реализация**: Правильное использование `prompt` как лирики
- **Убран несуществующий параметр**: Удален `lyrics` параметр

### ✅ Обработка ошибок
- **HTTP коды**: 400, 401, 429, 451, 500 с описательными сообщениями
- **Rate Limiting**: Увеличенные задержки (минимум 10 секунд)
- **Retry логика**: До 5 попыток для rate limited запросов

### ✅ База данных
- **Тип duration**: Изменен с integer на NUMERIC для десятичных значений
- **Очистка задач**: Автоматическое завершение processing/pending задач
- **Type Safety**: Правильное приведение типов в Edge Functions

### ✅ Мобильный интерфейс
- **Адаптивные сетки**: `grid-cols-1 sm:grid-cols-2` паттерны
- **Размеры элементов**: `text-sm sm:text-base` и `h-10 sm:h-12`
- **Отступы**: `p-2 sm:p-4` для правильного spacing

## 📚 Документация

- **[API Документация](docs/API.md)** - Полное описание всех endpoints
- **[Архитектура](docs/ARCHITECTURE.md)** - Структура и дизайн системы
- **[Suno API интеграция](docs/SUNO_API_INTEGRATION.md)** - Детали интеграции
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Решение проблем
- **[Мобильная оптимизация](docs/MOBILE_OPTIMIZATION.md)** - Mobile-first подход

## 🚀 Быстрый старт

### Предварительные требования
- Node.js 18.0+
- Аккаунт Supabase  
- API ключи Suno AI и/или Mureka AI

### Установка
```bash
# Клонировать репозиторий
git clone https://github.com/your-repo/ai-music-studio.git
cd ai-music-studio

# Установить зависимости
npm install

# Настроить Supabase (автоматически)
# API ключи добавляются через Supabase Dashboard → Settings → Functions → Secrets

# Запустить в dev режиме
npm run dev
```

### Конфигурация API ключей
```bash
# В Supabase Dashboard → Settings → Functions → Secrets
SUNO_API_KEY=your_suno_api_key
MUREKA_API_KEY=your_mureka_api_key
```

## 🎯 Готовность к продакшену

### ✅ Production Ready
- **Безопасность**: RLS политики для всех таблиц
- **Мониторинг**: Система отслеживания задач
- **Обработка ошибок**: Graceful handling всех ошибок
- **Производительность**: Оптимизированные запросы и компоненты
- **Мобильность**: Поддержка всех устройств от 320px

### 📊 Мониторинг
- **GenerationMonitor**: Компонент для отслеживания статистики
- **Автоочистка**: Cleanup функция для зависших задач
- **Метрики**: Успешность, время генерации, использование API

## 🛠️ Edge Functions

- **generate-music**: Генерация музыки с мульти-провайдерами
- **generate-lyrics**: Создание лирики через Suno API
- **get-generation-status**: Проверка статуса задач
- **suno-callback**: Webhook для обновлений от Suno
- **cleanup-stuck-tasks**: Автоматическая очистка
- **check-api-health**: Мониторинг здоровья API

## 📈 Roadmap

### v2.2.0 - Улучшения UX
- [ ] Визуализация аудио (спектрограмма)
- [ ] Эквалайзер и audio эффекты
- [ ] Keyboard shortcuts
- [ ] Drag & drop плейлисты

### v2.3.0 - Социальные функции
- [ ] Публичные плейлисты
- [ ] Система лайков и комментариев  
- [ ] Профили артистов
- [ ] Sharing в социальные сети

### v3.0.0 - Расширенная платформа
- [ ] Мобильное приложение (React Native)
- [ ] Desktop приложение (Electron)
- [ ] Marketplace для треков
- [ ] Коллаборативные функции

## 🤝 Участие в разработке

1. Fork репозитория
2. Создать feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Открыть Pull Request

### Стандарты кода
- **ESLint** + **Prettier** для форматирования
- **TypeScript** strict mode
- **Conventional Commits** для сообщений
- **Документация** для всех новых функций

## 📊 Статистика проекта

- **15+ таблиц** в PostgreSQL с RLS
- **12 Edge Functions** для backend логики
- **50+ React компонентов** с TypeScript
- **100% мобильная адаптация** от 320px
- **Официальное соответствие** Suno API v1

## 📞 Поддержка

- 📖 Документация: [docs/](docs/)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/ai-music-studio/issues)
- 💬 Обсуждения: [GitHub Discussions](https://github.com/your-repo/ai-music-studio/discussions)

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл для деталей.

---

<div align="center">

**[⬆ Наверх](#-ai-music-studio)**

Made with ❤️ by [AI Music Studio Team](https://github.com/your-repo)

[![GitHub stars](https://img.shields.io/github/stars/your-repo/ai-music-studio?style=social)](https://github.com/your-repo/ai-music-studio)

</div>