import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, LoginCredentials, RegisterCredentials } from '@/types/user';

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Интеграция с реальным API аутентификации
          // Пока используем mock данные
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (credentials.email === 'demo@example.com' && credentials.password === 'demo123') {
            const mockUser: User = {
              id: '1',
              username: 'demo_user',
              email: credentials.email,
              displayName: 'Demo User',
              avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face',
              bio: 'AI Music enthusiast',
              subscription: 'pro',
              credits: 1000,
              createdAt: new Date('2024-01-01'),
              lastLoginAt: new Date(),
              preferences: {
                theme: 'dark',
                language: 'en',
                notifications: {
                  email: true,
                  push: true,
                  generationComplete: true,
                  collaborationInvites: true,
                  communityUpdates: false,
                },
                audio: {
                  defaultQuality: 'high',
                  autoPlay: true,
                  crossfade: true,
                },
                privacy: {
                  profilePublic: true,
                  showActivity: true,
                  allowCollaboration: true,
                },
              },
              stats: {
                totalTracks: 42,
                totalPlays: 1337,
                totalLikes: 89,
                totalCreditsUsed: 500,
                favoriteGenres: ['Electronic', 'Pop', 'Jazz'],
                mostUsedProvider: 'mureka',
                averageTrackLength: 180,
                joinedDate: new Date('2024-01-01'),
                lastActiveDate: new Date(),
              },
            };
            
            set({ 
              user: mockUser, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            throw new Error('Invalid credentials');
          }
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false 
          });
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Интеграция с реальным API регистрации
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const mockUser: User = {
            id: Date.now().toString(),
            username: credentials.username,
            email: credentials.email,
            displayName: credentials.username,
            subscription: 'free',
            credits: 50,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            preferences: {
              theme: 'dark',
              language: 'en',
              notifications: {
                email: true,
                push: true,
                generationComplete: true,
                collaborationInvites: true,
                communityUpdates: true,
              },
              audio: {
                defaultQuality: 'standard',
                autoPlay: false,
                crossfade: false,
              },
              privacy: {
                profilePublic: false,
                showActivity: false,
                allowCollaboration: true,
              },
            },
            stats: {
              totalTracks: 0,
              totalPlays: 0,
              totalLikes: 0,
              totalCreditsUsed: 0,
              favoriteGenres: [],
              mostUsedProvider: 'mureka',
              averageTrackLength: 0,
              joinedDate: new Date(),
              lastActiveDate: new Date(),
            },
          };
          
          set({ 
            user: mockUser, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false 
          });
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      checkAuth: async () => {
        set({ isLoading: true });
        
        try {
          // TODO: Проверка токена с сервером
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Если пользователь уже есть в store, считаем его аутентифицированным
          const { user } = get();
          if (user) {
            set({ isAuthenticated: true, isLoading: false });
          } else {
            set({ isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: 'Authentication check failed'
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);