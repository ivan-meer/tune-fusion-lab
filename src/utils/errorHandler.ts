/**
 * Centralized error handling utilities
 * Provides consistent error messaging and logging
 */

export interface AppError {
  code: string;
  message: string;
  details?: any;
  retry?: boolean;
}

export class ApiError extends Error {
  public code: string;
  public retry: boolean;
  public details?: any;

  constructor(code: string, message: string, retry = false, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retry = retry;
    this.details = details;
  }
}

export function handleApiError(error: any): AppError {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message,
      retry: error.retry,
      details: error.details
    };
  }

  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Проблемы с подключением к интернету',
      retry: true
    };
  }

  // Timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return {
      code: 'TIMEOUT_ERROR',
      message: 'Превышено время ожидания',
      retry: true
    };
  }

  // Rate limit errors
  if (error.message.includes('429') || error.message.includes('rate limit')) {
    return {
      code: 'RATE_LIMIT_ERROR',
      message: 'Слишком много запросов. Попробуйте через минуту',
      retry: true
    };
  }

  // API quota/credits errors
  if (error.message.includes('quota') || error.message.includes('credits') || error.message.includes('insufficient')) {
    return {
      code: 'QUOTA_EXCEEDED',
      message: 'Превышен лимит API или недостаточно кредитов',
      retry: false
    };
  }

  // Auth errors
  if (error.message.includes('Unauthorized') || error.message.includes('401')) {
    return {
      code: 'AUTH_ERROR',
      message: 'Требуется авторизация',
      retry: false
    };
  }

  // Server errors (5xx)
  if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
    return {
      code: 'SERVER_ERROR',
      message: 'Временные проблемы на сервере',
      retry: true
    };
  }

  // Default error
  return {
    code: 'UNKNOWN_ERROR',
    message: error.message || 'Произошла неизвестная ошибка',
    retry: false
  };
}

export function getUserFriendlyMessage(error: AppError): string {
  const messages: Record<string, string> = {
    'NETWORK_ERROR': 'Проверьте подключение к интернету и попробуйте снова',
    'TIMEOUT_ERROR': 'Запрос занял слишком много времени. Попробуйте снова',
    'RATE_LIMIT_ERROR': 'Слишком много запросов. Подождите немного и попробуйте снова',
    'QUOTA_EXCEEDED': 'Превышен лимит использования API. Попробуйте позже',
    'AUTH_ERROR': 'Необходимо войти в систему заново',
    'SERVER_ERROR': 'Временные проблемы с сервером. Попробуйте через несколько минут',
    'UNKNOWN_ERROR': 'Произошла неожиданная ошибка'
  };

  return messages[error.code] || error.message;
}

export function shouldRetry(error: AppError): boolean {
  return error.retry === true;
}

export function getRetryDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s (max)
  return Math.min(1000 * Math.pow(2, attempt), 16000);
}