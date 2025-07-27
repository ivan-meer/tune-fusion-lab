// ============================================================================
// ENHANCED MUSIC GENERATION TYPES WITH STREAMING AND ADVANCED PROGRESS
// ============================================================================

import { GenerationStep } from '@/components/music/GenerationSteps';

/**
 * Enhanced generation request with proper prompt structuring
 * IMPORTANT: prompt ≠ lyrics! Prompt is for DESCRIPTION, not song text
 */
export interface EnhancedGenerationRequest {
  // Core request data
  prompt: string;              // USER DESCRIPTION (NOT lyrics!) 
  provider: 'suno' | 'mureka' | 'test';
  model?: string;
  
  // Generated/enhanced content  
  enhancedPrompt?: string;     // AI-enhanced description
  generatedLyrics?: string;    // Separate generated lyrics
  styleDescription?: string;   // Enhanced style description
  
  // Configuration
  style?: string;
  duration?: number;
  instrumental?: boolean;
  language?: string;
  
  // Draft system
  parentTrackId?: string;      // For creating variations
  variationType?: 'manual' | 'auto_improve' | 'style_change' | 'lyrics_change';
  isDraft?: boolean;           // Mark as draft for first generation
}

/**
 * Enhanced generation job with detailed steps and streaming support
 */
export interface EnhancedGenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  
  // Detailed steps for advanced progress tracking
  steps: GenerationStep[];
  currentStepIndex: number;
  
  // Enhanced tracking
  creditsUsed: number;
  estimatedTimeRemaining?: number;
  tokensGenerated?: number;
  
  // Results
  track?: {
    id: string;
    title: string;
    file_url: string;
    artwork_url?: string;
    duration: number;
    created_at: string;
    is_draft?: boolean;
    parent_draft_id?: string;
  };
  
  // Enhanced metadata
  processingLog: ProcessingLogEntry[];
  generatedContent?: {
    enhancedPrompt?: string;
    generatedLyrics?: string;
    styleDescription?: string;
  };
}

/**
 * Processing log entry for detailed monitoring and debugging
 */
export interface ProcessingLogEntry {
  timestamp: string;
  step: string;
  status: 'started' | 'completed' | 'failed' | 'progress';
  message: string;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Track variation relationship
 */
export interface TrackVariation {
  id: string;
  parent_track_id: string;
  child_track_id: string;
  variation_type: 'manual' | 'auto_improve' | 'style_change' | 'lyrics_change';
  created_at: string;
  updated_at: string;
}

/**
 * Enhanced track with draft/variation support
 */
export interface EnhancedTrack {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  artwork_url?: string;
  duration: number;
  
  // Draft system
  is_draft: boolean;
  parent_draft_id?: string;
  variations?: EnhancedTrack[];  // Child variations
  parent_draft?: EnhancedTrack;  // Parent reference
  
  // Enhanced metadata
  generation_params?: EnhancedGenerationRequest;
  processing_log?: ProcessingLogEntry[];
  
  // Standard fields
  user_id: string;
  provider: string;
  provider_track_id?: string;
  lyrics?: string;
  genre?: string;
  mood?: string;
  tags?: string[];
  is_public: boolean;
  play_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Progress update from streaming API
 */
export interface ProgressUpdate {
  jobId: string;
  step: string;
  progress: number;
  status: 'processing' | 'completed' | 'failed';
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Real-time event types for WebSocket/SSE streaming
 */
export type RealtimeEvent = 
  | { type: 'progress_update'; data: ProgressUpdate }
  | { type: 'step_completed'; data: { jobId: string; step: string; result?: any } }
  | { type: 'job_completed'; data: { jobId: string; track: EnhancedTrack } }
  | { type: 'job_failed'; data: { jobId: string; error: string } }
  | { type: 'content_generated'; data: { jobId: string; content: any } };

/**
 * Music generation configuration
 */
export interface GenerationConfig {
  // Provider settings
  provider: 'suno' | 'mureka' | 'test';
  model: string;
  
  // Quality settings
  useEnhancedPrompts: boolean;
  generateLyrics: boolean;
  enhanceStyle: boolean;
  
  // Streaming settings
  enableRealtime: boolean;
  progressUpdateInterval: number;
  
  // Credits and limits
  maxCreditsPerGeneration: number;
  enableCreditChecks: boolean;
}

/**
 * Generation statistics for monitoring
 */
export interface GenerationStats {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageGenerationTime: number;
  creditsUsed: number;
  popularProviders: Record<string, number>;
  commonErrors: Record<string, number>;
}