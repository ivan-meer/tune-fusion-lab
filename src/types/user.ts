// Типы пользователей и аутентификации

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  displayName: string;
  bio?: string;
  website?: string;
  social?: {
    twitter?: string;
    instagram?: string;
    youtube?: string;
    soundcloud?: string;
  };
  subscription: SubscriptionTier;
  credits: number;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    generationComplete: boolean;
    collaborationInvites: boolean;
    communityUpdates: boolean;
  };
  audio: {
    defaultQuality: 'standard' | 'high' | 'lossless';
    autoPlay: boolean;
    crossfade: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showActivity: boolean;
    allowCollaboration: boolean;
  };
}

export interface UserStats {
  totalTracks: number;
  totalPlays: number;
  totalLikes: number;
  totalCreditsUsed: number;
  favoriteGenres: string[];
  mostUsedProvider: 'mureka' | 'suno' | 'hybrid';
  averageTrackLength: number;
  joinedDate: Date;
  lastActiveDate: Date;
}

// Subscription Types
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionFeatures {
  creditsPerMonth: number;
  maxTrackLength: number;
  concurrentGenerations: number;
  highQualityAudio: boolean;
  commercialUse: boolean;
  watermarkFree: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  collaborationTools: boolean;
  advancedFeatures: boolean;
  customization: boolean;
}

export interface SubscriptionTiers {
  free: SubscriptionFeatures;
  pro: SubscriptionFeatures;
  enterprise: SubscriptionFeatures;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeSubscriptionId?: string;
  features: SubscriptionFeatures;
}

// Authentication Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  website?: string;
  social?: User['social'];
  avatar?: File;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}