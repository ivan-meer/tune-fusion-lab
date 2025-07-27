import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Clock, 
  Loader2, 
  XCircle,
  Sparkles,
  FileText,
  Music,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GenerationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  duration?: number;
  result?: any;
}

interface GenerationStepsProps {
  steps: GenerationStep[];
  className?: string;
}

const stepIcons = {
  credits: CheckCircle,
  style: Sparkles,
  lyrics: FileText,
  music: Music,
  download: Download
};

const statusColors = {
  pending: 'text-muted-foreground',
  processing: 'text-primary',
  completed: 'text-green-500',
  failed: 'text-red-500'
};

const statusIcons = {
  pending: Clock,
  processing: Loader2,
  completed: CheckCircle,
  failed: XCircle
};

export default function GenerationSteps({ steps, className }: GenerationStepsProps) {
  const currentStep = steps.findIndex(step => step.status === 'processing');
  const overallProgress = (steps.filter(step => step.status === 'completed').length / steps.length) * 100;

  return (
    <Card className={className}>
      <CardContent className="p-6 space-y-6">
        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Прогресс генерации</span>
            <span className="text-muted-foreground">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Step list */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const StepIcon = stepIcons[step.id as keyof typeof stepIcons] || Music;
            const StatusIcon = statusIcons[step.status];
            const isActive = step.status === 'processing';
            const isCompleted = step.status === 'completed';
            const isFailed = step.status === 'failed';

            return (
              <div key={step.id} className="relative">
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div 
                    className={cn(
                      "absolute left-6 top-12 w-0.5 h-8 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-muted"
                    )} 
                  />
                )}

                {/* Step content */}
                <div className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border transition-all",
                  isActive && "bg-primary/5 border-primary/20",
                  isCompleted && "bg-green-50 border-green-200",
                  isFailed && "bg-red-50 border-red-200"
                )}>
                  {/* Step icon */}
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors",
                    isCompleted && "bg-green-100 border-green-500",
                    isActive && "bg-primary/10 border-primary",
                    isFailed && "bg-red-100 border-red-500",
                    step.status === 'pending' && "bg-muted border-muted-foreground/20"
                  )}>
                    {isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      <StepIcon className={cn(
                        "w-5 h-5",
                        statusColors[step.status]
                      )} />
                    )}
                  </div>

                  {/* Step details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        "font-medium",
                        statusColors[step.status]
                      )}>
                        {step.title}
                      </h4>
                      <Badge variant={
                        isCompleted ? "default" :
                        isActive ? "secondary" :
                        isFailed ? "destructive" :
                        "outline"
                      }>
                        {step.status === 'pending' && 'Ожидание'}
                        {step.status === 'processing' && 'Выполняется'}
                        {step.status === 'completed' && 'Завершено'}
                        {step.status === 'failed' && 'Ошибка'}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {step.description}
                    </p>

                    {/* Step progress */}
                    {isActive && step.progress !== undefined && (
                      <div className="space-y-1">
                        <Progress value={step.progress} className="h-1" />
                        <div className="text-xs text-muted-foreground">
                          {step.progress}%
                        </div>
                      </div>
                    )}

                    {/* Step duration */}
                    {step.duration && (isCompleted || isFailed) && (
                      <div className="text-xs text-muted-foreground">
                        Время выполнения: {step.duration}мс
                      </div>
                    )}

                    {/* Step result preview */}
                    {step.result && isCompleted && (
                      <div className="mt-2 p-2 bg-background rounded border text-xs">
                        <div className="font-medium mb-1">Результат:</div>
                        <div className="text-muted-foreground truncate">
                          {typeof step.result === 'string' 
                            ? step.result 
                            : JSON.stringify(step.result).substring(0, 100) + '...'
                          }
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status indicator */}
                  <div className="flex-shrink-0">
                    <StatusIcon className={cn(
                      "w-5 h-5",
                      statusColors[step.status],
                      isActive && "animate-spin"
                    )} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}