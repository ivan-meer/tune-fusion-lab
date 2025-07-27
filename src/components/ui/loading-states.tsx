/**
 * Loading States Components
 * 
 * Reusable loading indicators, skeletons, and loading states
 * for different parts of the application
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Music, Loader2 } from 'lucide-react';

// Generic loading spinner
export const LoadingSpinner = ({ 
  size = 'default', 
  className 
}: { 
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  );
};

// Loading button state
export const LoadingButton = ({ 
  children, 
  isLoading, 
  className,
  ...props 
}: {
  children: React.ReactNode;
  isLoading: boolean;
  className?: string;
  [key: string]: any;
}) => {
  return (
    <button 
      className={cn('flex items-center gap-2', className)}
      disabled={isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {children}
    </button>
  );
};

// Track card skeleton
export const TrackCardSkeleton = ({ 
  viewMode = 'grid' 
}: { 
  viewMode?: 'grid' | 'list' 
}) => {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 border rounded-lg">
        <Skeleton className="w-12 h-12 rounded" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <Skeleton className="w-full h-full" />
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <div className="flex gap-1">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="w-8 h-8 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Track list loading state
export const TrackListLoading = ({ 
  count = 6, 
  viewMode = 'grid' 
}: { 
  count?: number;
  viewMode?: 'grid' | 'list';
}) => {
  return (
    <div className={cn(
      viewMode === 'grid' 
        ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
        : 'space-y-4'
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <TrackCardSkeleton key={i} viewMode={viewMode} />
      ))}
    </div>
  );
};

// Library loading state
export const LibraryLoadingState = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-16 ml-2" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        
        {/* Track list skeleton */}
        <TrackListLoading />
      </CardContent>
    </Card>
  </div>
);

// Empty state component
export const EmptyState = ({
  icon: Icon = Music,
  title,
  description,
  action
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center space-y-4 max-w-md">
      <div className="p-4 rounded-full bg-muted w-fit mx-auto">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  </div>
);

// Page loading overlay
export const PageLoadingOverlay = ({ message = 'Загрузка...' }: { message?: string }) => (
  <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Inline loading state
export const InlineLoading = ({ 
  message = 'Загрузка...',
  size = 'default'
}: { 
  message?: string;
  size?: 'sm' | 'default' | 'lg';
}) => (
  <div className="flex items-center gap-2 justify-center py-4">
    <LoadingSpinner size={size} />
    <span className="text-muted-foreground text-sm">{message}</span>
  </div>
);