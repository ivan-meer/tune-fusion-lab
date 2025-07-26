import { create } from 'zustand';
import type { 
  Track, 
  Playlist, 
  Project, 
  UnifiedMusicRequest, 
  MusicGenerationResult,
  Provider 
} from '@/types/music';

interface GenerationJob {
  id: string;
  request: UnifiedMusicRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: MusicGenerationResult;
  error?: string;
  createdAt: Date;
}

interface MusicStore {
  // State
  tracks: Track[];
  playlists: Playlist[];
  projects: Project[];
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  generationJobs: GenerationJob[];
  isLoading: boolean;
  
  // Player Actions
  playTrack: (track: Track) => void;
  pauseTrack: () => void;
  stopTrack: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  
  // Library Actions
  addTrack: (track: Track) => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  likeTrack: (trackId: string) => void;
  
  // Playlist Actions
  createPlaylist: (name: string, description?: string) => Playlist;
  addToPlaylist: (playlistId: string, trackId: string) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  deletePlaylist: (playlistId: string) => void;
  
  // Generation Actions
  generateMusic: (request: UnifiedMusicRequest) => Promise<string>;
  getGenerationStatus: (jobId: string) => GenerationJob | undefined;
  cancelGeneration: (jobId: string) => void;
  
  // Data Loading
  loadUserTracks: () => Promise<void>;
  loadUserPlaylists: () => Promise<void>;
  
  // Utility
  clearError: () => void;
}

// Mock данные для разработки
const mockTracks: Track[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    artist: 'AI Composer',
    duration: 180,
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    genre: 'Electronic',
    mood: 'Upbeat',
    bpm: 128,
    key: 'C Major',
    tags: ['electronic', 'upbeat', 'synth'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    isPublic: true,
    provider: 'mureka',
    likes: 42,
    plays: 156,
    owner: {
      id: '1',
      username: 'demo_user',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face'
    }
  },
  {
    id: '2',
    title: 'Midnight Jazz',
    artist: 'AI Orchestra',
    duration: 240,
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    genre: 'Jazz',
    mood: 'Relaxed',
    bpm: 90,
    key: 'F# Minor',
    tags: ['jazz', 'relaxed', 'piano'],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    isPublic: true,
    provider: 'suno',
    likes: 73,
    plays: 289,
    owner: {
      id: '1',
      username: 'demo_user',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face'
    }
  },
  {
    id: '3',
    title: 'Cyberpunk Anthem',
    artist: 'Neural Network',
    duration: 200,
    url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
    genre: 'Electronic',
    mood: 'Energetic',
    bpm: 140,
    key: 'A Minor',
    tags: ['cyberpunk', 'energetic', 'bass'],
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
    isPublic: false,
    provider: 'hybrid',
    likes: 91,
    plays: 412,
    owner: {
      id: '1',
      username: 'demo_user',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face'
    }
  }
];

export const useMusicStore = create<MusicStore>((set, get) => ({
  // Initial State
  tracks: [],
  playlists: [],
  projects: [],
  currentTrack: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  generationJobs: [],
  isLoading: false,

  // Player Actions
  playTrack: (track: Track) => {
    set({ currentTrack: track, isPlaying: true });
  },

  pauseTrack: () => {
    set({ isPlaying: false });
  },

  stopTrack: () => {
    set({ isPlaying: false, currentTime: 0 });
  },

  seekTo: (time: number) => {
    set({ currentTime: time });
  },

  setVolume: (volume: number) => {
    set({ volume: Math.max(0, Math.min(1, volume)) });
  },

  // Library Actions
  addTrack: (track: Track) => {
    set(state => ({ tracks: [...state.tracks, track] }));
  },

  removeTrack: (trackId: string) => {
    set(state => ({ 
      tracks: state.tracks.filter(t => t.id !== trackId),
      currentTrack: state.currentTrack?.id === trackId ? null : state.currentTrack
    }));
  },

  updateTrack: (trackId: string, updates: Partial<Track>) => {
    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      )
    }));
  },

  likeTrack: (trackId: string) => {
    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId 
          ? { ...track, likes: track.likes + 1 }
          : track
      )
    }));
  },

  // Playlist Actions
  createPlaylist: (name: string, description?: string) => {
    const playlist: Playlist = {
      id: Date.now().toString(),
      name,
      description,
      tracks: [],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: {
        id: '1',
        username: 'demo_user'
      }
    };
    
    set(state => ({ playlists: [...state.playlists, playlist] }));
    return playlist;
  },

  addToPlaylist: (playlistId: string, trackId: string) => {
    const { tracks } = get();
    const track = tracks.find(t => t.id === trackId);
    
    if (track) {
      set(state => ({
        playlists: state.playlists.map(playlist =>
          playlist.id === playlistId
            ? { 
                ...playlist, 
                tracks: [...playlist.tracks, track],
                updatedAt: new Date()
              }
            : playlist
        )
      }));
    }
  },

  removeFromPlaylist: (playlistId: string, trackId: string) => {
    set(state => ({
      playlists: state.playlists.map(playlist =>
        playlist.id === playlistId
          ? { 
              ...playlist, 
              tracks: playlist.tracks.filter(t => t.id !== trackId),
              updatedAt: new Date()
            }
          : playlist
      )
    }));
  },

  deletePlaylist: (playlistId: string) => {
    set(state => ({
      playlists: state.playlists.filter(p => p.id !== playlistId)
    }));
  },

  // Generation Actions
  generateMusic: async (request: UnifiedMusicRequest): Promise<string> => {
    const jobId = Date.now().toString();
    
    const job: GenerationJob = {
      id: jobId,
      request,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };
    
    set(state => ({ 
      generationJobs: [...state.generationJobs, job],
      isLoading: true 
    }));

    // Симуляция процесса генерации
    try {
      // Обновляем статус на "processing"
      set(state => ({
        generationJobs: state.generationJobs.map(j =>
          j.id === jobId ? { ...j, status: 'processing' as const } : j
        )
      }));

      // Симуляция прогресса
      for (let progress = 10; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        set(state => ({
          generationJobs: state.generationJobs.map(j =>
            j.id === jobId ? { ...j, progress } : j
          )
        }));
      }

      // Создаем результат
      const result: MusicGenerationResult = {
        id: jobId,
        status: 'completed',
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: request.options.duration || 180,
        metadata: {
          title: `Generated Track ${Date.now()}`,
          artist: 'AI Composer',
          genre: request.options.genre,
          mood: request.options.mood,
          generated_at: new Date(),
          provider: request.provider
        },
        progress: 100
      };

      // Создаем новый трек
      const newTrack: Track = {
        id: result.id,
        title: result.metadata.title || 'Generated Track',
        artist: result.metadata.artist || 'AI',
        duration: result.duration || 180,
        url: result.audioUrl || '',
        genre: result.metadata.genre,
        mood: result.metadata.mood,
        tags: [request.options.genre, request.options.mood].filter(Boolean) as string[],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublic: false,
        provider: request.provider,
        likes: 0,
        plays: 0,
        owner: {
          id: '1',
          username: 'demo_user'
        }
      };

      set(state => ({
        generationJobs: state.generationJobs.map(j =>
          j.id === jobId ? { ...j, status: 'completed' as const, result } : j
        ),
        tracks: [...state.tracks, newTrack],
        isLoading: false
      }));

      return jobId;
    } catch (error) {
      set(state => ({
        generationJobs: state.generationJobs.map(j =>
          j.id === jobId 
            ? { 
                ...j, 
                status: 'failed' as const, 
                error: error instanceof Error ? error.message : 'Generation failed' 
              } 
            : j
        ),
        isLoading: false
      }));
      throw error;
    }
  },

  getGenerationStatus: (jobId: string) => {
    return get().generationJobs.find(job => job.id === jobId);
  },

  cancelGeneration: (jobId: string) => {
    set(state => ({
      generationJobs: state.generationJobs.filter(job => job.id !== jobId)
    }));
  },

  // Data Loading
  loadUserTracks: async () => {
    set({ isLoading: true });
    
    try {
      // TODO: Заменить на реальный API вызов
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ tracks: mockTracks, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  loadUserPlaylists: async () => {
    set({ isLoading: true });
    
    try {
      // TODO: Заменить на реальный API вызов
      await new Promise(resolve => setTimeout(resolve, 500));
      set({ playlists: [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  clearError: () => {
    // Utility function for clearing errors
  }
}));