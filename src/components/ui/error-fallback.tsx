/**
 * Error Fallback Component
 * Provides a user-friendly error display with retry functionality
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, Home, Bug } from 'lucide-react';
import { handleApiError, getUserFriendlyMessage, shouldRetry } from '@/utils/errorHandler';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  title?: string;
  showDetails?: boolean;
}

export function ErrorFallback({ error, resetError, title = "Что-то пошло не так", showDetails = false }: ErrorFallbackProps) {
  const appError = handleApiError(error);
  const userMessage = getUserFriendlyMessage(appError);
  const canRetry = shouldRetry(appError);

  const handleReportError = () => {
    // In a real app, this would send error report to your logging service
    console.error('Error reported:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    // Could open email client or error reporting form
    const subject = `Ошибка в приложении: ${error.message.slice(0, 50)}`;
    const body = `Опишите что вы делали когда возникла ошибка:\n\n\nТехническая информация:\nОшибка: ${error.message}\nВремя: ${new Date().toISOString()}\nURL: ${window.location.href}`;
    window.open(`mailto:support@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-center">
              {userMessage}
            </AlertDescription>
          </Alert>

          {showDetails && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground mb-2">
                Техническая информация
              </summary>
              <div className="bg-muted p-3 rounded text-xs font-mono">
                <div><strong>Ошибка:</strong> {error.message}</div>
                <div><strong>Тип:</strong> {error.name}</div>
                <div><strong>Код:</strong> {appError.code}</div>
                {error.stack && (
                  <div className="mt-2">
                    <strong>Stack trace:</strong>
                    <pre className="whitespace-pre-wrap text-xs mt-1">
                      {error.stack.slice(0, 500)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex flex-col gap-2">
            {canRetry && (
              <Button onClick={resetError} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Попробовать снова
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              На главную
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleReportError}
              className="w-full text-muted-foreground"
            >
              <Bug className="h-4 w-4 mr-2" />
              Сообщить об ошибке
            </Button>
          </div>

          {appError.code === 'NETWORK_ERROR' && (
            <div className="text-xs text-muted-foreground text-center">
              Проверьте подключение к интернету и попробуйте еще раз
            </div>
          )}

          {appError.code === 'QUOTA_EXCEEDED' && (
            <div className="text-xs text-muted-foreground text-center">
              Лимиты API восстанавливаются каждый день
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Component for wrapping sections that might error
interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export function ErrorBoundaryWrapper({ children, fallback: Fallback }: ErrorBoundaryWrapperProps) {
  const defaultFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
    <ErrorFallback error={error} resetError={resetError} />
  );
  
  return (
    <ErrorBoundary fallback={Fallback || defaultFallback}>
      {children}
    </ErrorBoundary>
  );
}

// Simple error boundary class component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ComponentType<{ error: Error; resetError: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const Fallback = this.props.fallback;
      return <Fallback error={this.state.error} resetError={this.retry} />;
    }

    return this.props.children;
  }
}