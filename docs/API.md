# 🔌 API Documentation

Complete API reference for AI Music Studio, including Edge Functions, client hooks, and data models.

## 📋 Table of Contents

- [Authentication](#authentication)
- [Edge Functions](#edge-functions)
- [Client Hooks](#client-hooks)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Authentication

All API requests require authentication using Supabase JWT tokens.

### Headers
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Getting User Token
```typescript
const { data: session } = await supabase.auth.getSession();
const token = session?.access_token;
```

## Edge Functions

### Generate Music

#### `POST /functions/v1/generate-music`

Generate music using AI providers.

**Request Body:**
```typescript
interface GenerationRequest {
  prompt: string;              // Music description
  provider: 'suno' | 'mureka' | 'test';
  model?: string;             // AI model to use
  style?: string;             // Music genre/style
  duration?: number;          // Duration in seconds (30-180)
  instrumental?: boolean;     // Generate instrumental version
  lyrics?: string;           // Custom lyrics (optional)
}
```

**Response:**
```typescript
interface GenerationResponse {
  success: boolean;
  data: {
    jobId: string;           // Generation job ID
    status: 'pending';       // Initial status
    estimatedTime: number;   // Estimated completion time (seconds)
  };
}
```

**Example:**
```typescript
const response = await supabase.functions.invoke('generate-music', {
  body: {
    prompt: "Upbeat electronic dance track with synthesizers",
    provider: "suno",
    model: "V4_5",
    style: "electronic",
    duration: 120,
    instrumental: false
  }
});
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request parameters
- `401` - Unauthorized
- `429` - Rate limit exceeded
- `500` - Server error

### Generate Lyrics

#### `POST /functions/v1/generate-lyrics`

Generate song lyrics using AI.

**Request Body:**
```typescript
interface LyricsRequest {
  prompt: string;           // Song theme/description
  style: string;           // Musical style
  language: string;        // Language (default: "russian")
  structure: string;       // Song structure (verse-chorus-verse)
}
```

**Response:**
```typescript
interface LyricsResponse {
  success: boolean;
  data: {
    lyrics: string;        // Generated lyrics
    title: string;         // Suggested title
    structure: string[];   // Song sections
  };
}
```

### Get Generation Status

#### `GET /functions/v1/get-generation-status?jobId={jobId}`

Check the status of a music generation job.

**Query Parameters:**
- `jobId` (string, required) - Generation job ID

**Response:**
```typescript
interface StatusResponse {
  success: boolean;
  data: {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;      // 0-100
    estimatedTimeRemaining?: number;
    result?: {
      trackId: string;
      audioUrl: string;
      duration: number;
      metadata: TrackMetadata;
    };
    error?: string;
  };
}
```

### Suno Callback

#### `POST /functions/v1/suno-callback`

Webhook endpoint for Suno AI status updates (internal use).

**Request Body:**
```typescript
interface SunoCallback {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  result?: {
    audio_url: string;
    video_url?: string;
    title: string;
    lyrics?: string;
    metadata: object;
  };
  error?: string;
}
```

### Test Authentication

#### `GET /functions/v1/test-auth`

Test authentication and server connectivity.

**Response:**
```typescript
interface TestAuthResponse {
  success: boolean;
  data: {
    userId: string;
    timestamp: string;
    serverStatus: 'healthy';
  };
}
```

## Client Hooks

### useAudioPlayer

Manages global audio playback state.

```typescript
const [playerState, playerActions] = useAudioPlayer();

// State
interface AudioPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;           // 0-1
  isMuted: boolean;
  isLoading: boolean;
  error: string | null;
  playlist: Track[];
  currentIndex: number;
  repeatMode: 'none' | 'one' | 'all';
  shuffleEnabled: boolean;
}

// Actions
interface AudioPlayerActions {
  playTrack: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  setPlaylist: (tracks: Track[]) => void;
  toggleShuffle: () => void;
  setRepeatMode: (mode: RepeatMode) => void;
}
```

### useMusicGeneration

Handles music generation requests and job tracking.

```typescript
const { generateMusic, resetGeneration, isGenerating, currentJob } = useMusicGeneration();

interface GenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  request: GenerationRequest;
  track?: Track;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Functions
const generateMusic = async (request: GenerationRequest) => Promise<void>;
const resetGeneration = () => void;
```

### useUserTracks

Manages user's track library.

```typescript
const {
  tracks,
  isLoading,
  error,
  loadTracks,
  deleteTrack,
  likeTrack,
  syncTrackStorage,
  uploadTrack
} = useUserTracks();

interface Track {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  file_url?: string;
  artwork_url?: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  is_public: boolean;
  provider: 'mureka' | 'suno' | 'hybrid';
  lyrics?: string;
  tags?: string[];
  play_count: number;
  like_count: number;
  created_at: string;
  updated_at: string;
}
```

### useRealtimeUpdates

Subscribes to real-time database updates.

```typescript
useRealtimeUpdates({
  onJobUpdate: (job: GenerationJob) => void;
  onTrackUpdate: (track: Track) => void;
  onTrackDeleted: (trackId: string) => void;
});
```

## Data Models

### Track

```typescript
interface Track {
  id: string;                 // UUID
  user_id: string;           // Owner UUID
  title: string;             // Track title
  description?: string;      // Optional description
  duration?: number;         // Duration in seconds
  file_url?: string;         // Audio file URL
  file_path?: string;        // Storage file path
  artwork_url?: string;      // Cover image URL
  genre?: string;           // Music genre
  mood?: string;            // Track mood
  bpm?: number;             // Beats per minute
  key_signature?: string;   // Musical key
  is_public: boolean;       // Public visibility
  is_commercial: boolean;   // Commercial use allowed
  provider: 'mureka' | 'suno' | 'hybrid';
  provider_track_id?: string;
  lyrics?: string;          // Song lyrics
  tags?: string[];          // Search tags
  play_count: number;       // Play statistics
  like_count: number;       // Like count
  file_size?: number;       // File size in bytes
  audio_format: string;     // Audio format (mp3, wav, etc.)
  generation_params?: object; // Generation parameters
  created_at: string;       // ISO timestamp
  updated_at: string;       // ISO timestamp
}
```

### Playlist

```typescript
interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_url?: string;
  is_public: boolean;
  track_count: number;
  total_duration: number;    // Total duration in seconds
  created_at: string;
  updated_at: string;
  tracks?: PlaylistTrack[];
}

interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
  track?: Track;
}
```

### Generation Job

```typescript
interface GenerationJob {
  id: string;
  user_id: string;
  track_id?: string;         // Associated track after completion
  provider: string;
  model?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;          // 0-100
  request_params: object;    // Original request
  response_data?: object;    // Provider response
  error_message?: string;
  credits_used: number;
  created_at: string;
  updated_at: string;
}
```

### User Profile

```typescript
interface Profile {
  id: string;               // Matches auth.users.id
  username?: string;
  avatar_url?: string;
  telegram_id?: string;
  phone_number?: string;
  user_status: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}
```

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;            // Error code
    message: string;         // Human readable message
    details?: object;        // Additional error details
    timestamp: string;       // ISO timestamp
  };
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTH_REQUIRED` | Authentication required | 401 |
| `INVALID_REQUEST` | Invalid request parameters | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMITED` | Too many requests | 429 |
| `PROVIDER_ERROR` | AI provider error | 502 |
| `STORAGE_ERROR` | File storage error | 500 |
| `DATABASE_ERROR` | Database operation error | 500 |

### Error Handling in Client

```typescript
try {
  const result = await supabase.functions.invoke('generate-music', {
    body: request
  });
  
  if (result.error) {
    throw new Error(result.error.message);
  }
  
  return result.data;
} catch (error) {
  console.error('Generation failed:', error);
  
  // Handle specific error types
  if (error.message.includes('rate limit')) {
    showToast('Too many requests. Please wait a moment.', 'warning');
  } else if (error.message.includes('unauthorized')) {
    redirectToLogin();
  } else {
    showToast('Generation failed. Please try again.', 'error');
  }
}
```

## Rate Limiting

### Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/generate-music` | 5 requests | 1 minute |
| `/generate-lyrics` | 10 requests | 1 minute |
| `/get-generation-status` | 60 requests | 1 minute |
| All others | 100 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1640995200
```

## Examples

### Complete Music Generation Flow

```typescript
async function generateAndPlayTrack() {
  try {
    // 1. Start generation
    const { generateMusic, currentJob } = useMusicGeneration();
    await generateMusic({
      prompt: "Upbeat pop song about summer",
      provider: "suno",
      style: "pop",
      duration: 120
    });
    
    // 2. Monitor progress
    const unsubscribe = supabase
      .channel('generation_jobs')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'generation_jobs',
        filter: `id=eq.${currentJob.id}`
      }, (payload) => {
        console.log('Progress:', payload.new.progress);
        
        if (payload.new.status === 'completed') {
          // 3. Play completed track
          const [, playerActions] = useAudioPlayer();
          playerActions.playTrack(payload.new.track);
          unsubscribe();
        }
      })
      .subscribe();
      
  } catch (error) {
    console.error('Generation failed:', error);
  }
}
```

### Batch Track Operations

```typescript
async function batchDeleteTracks(trackIds: string[]) {
  const results = await Promise.allSettled(
    trackIds.map(id => 
      supabase.from('tracks').delete().eq('id', id)
    )
  );
  
  const failed = results
    .filter((result, index) => result.status === 'rejected')
    .map((_, index) => trackIds[index]);
    
  if (failed.length > 0) {
    console.warn('Failed to delete tracks:', failed);
  }
  
  return {
    deleted: trackIds.length - failed.length,
    failed: failed.length
  };
}
```

### Custom Audio Player Integration

```typescript
function CustomAudioPlayer() {
  const [playerState, playerActions] = useAudioPlayer();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(!!playerState.currentTrack);
  }, [playerState.currentTrack]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur">
      <div className="flex items-center gap-4 p-4">
        {/* Track info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">
            {playerState.currentTrack?.title}
          </h4>
          <p className="text-sm text-muted-foreground">
            {formatDuration(playerState.currentTime)} / {formatDuration(playerState.duration)}
          </p>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button onClick={playerActions.previousTrack} size="sm" variant="ghost">
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            onClick={playerState.isPlaying ? playerActions.pause : playerActions.resume}
            size="sm"
          >
            {playerState.isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button onClick={playerActions.nextTrack} size="sm" variant="ghost">
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Progress */}
        <div className="flex-1">
          <Slider
            value={[playerState.currentTime]}
            max={playerState.duration}
            step={0.1}
            onValueChange={([value]) => playerActions.seekTo(value)}
            className="cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
```

This API documentation provides a complete reference for integrating with AI Music Studio's backend services and client utilities.