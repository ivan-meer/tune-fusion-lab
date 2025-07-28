/**
 * Enhanced Toast Component with better error handling
 * Provides retry functionality and improved UX for API errors
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Toast, ToastAction } from '@/components/ui/toast';
import type { AppError } from '@/utils/errorHandler';

interface EnhancedToastProps {
  error?: AppError;
  success?: string;
  info?: string;
  warning?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function EnhancedToast({ error, success, info, warning, onRetry, onDismiss }: EnhancedToastProps) {
  const getToastConfig = () => {
    if (error) {
      return {
        variant: 'destructive' as const,
        icon: <AlertCircle className="h-4 w-4" />,
        title: 'Ошибка',
        description: error.message,
        action: error.retry && onRetry ? (
          <ToastAction altText="Повторить" onClick={onRetry}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Повторить
          </ToastAction>
        ) : undefined
      };
    }

    if (success) {
      return {
        variant: 'default' as const,
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        title: 'Успешно',
        description: success
      };
    }

    if (warning) {
      return {
        variant: 'default' as const,
        icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
        title: 'Внимание',
        description: warning
      };
    }

    if (info) {
      return {
        variant: 'default' as const,
        icon: <Info className="h-4 w-4 text-blue-500" />,
        title: 'Информация',
        description: info
      };
    }

    return null;
  };

  const config = getToastConfig();
  if (!config) return null;

  return (
    <Toast variant={config.variant}>
      <div className="flex items-start gap-3">
        {config.icon}
        <div className="flex-1">
          <div className="font-semibold">{config.title}</div>
          <div className="text-sm opacity-90">{config.description}</div>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {config.action}
    </Toast>
  );
}

// Hook for easier usage
export function useEnhancedToast() {
  const showError = (error: AppError, onRetry?: () => void) => {
    // This would integrate with your existing toast system
    // Implementation depends on your toast provider
  };

  const showSuccess = (message: string) => {
    // Implementation for success toasts
  };

  const showWarning = (message: string) => {
    // Implementation for warning toasts
  };

  const showInfo = (message: string) => {
    // Implementation for info toasts
  };

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo
  };
}