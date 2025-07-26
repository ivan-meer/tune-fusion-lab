// Типы для музыкального AI приложения согласно ТЗ

export type Language = 'en' | 'ru' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';

export type MusicStyle = 'pop' | 'rock' | 'jazz' | 'classical' | 'electronic' | 'hip-hop' | 'country' | 'blues' | 'reggae' | 'metal';

export type AudioFormat = 'mp3' | 'wav' | 'flac' | 'aac';

export type Provider = 'mureka' | 'suno' | 'hybrid';

// Mureka AI Types
export interface MurekaV6Config {
  version: 'v6';
  capabilities: string[];
}

export interface MurekaO1Config {
  version: 'o1';
  chainOfThought: boolean;
}

export interface VocalStyle {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
}

export interface ReferenceTrackConfig {
  maxSize: number;
  allowedFormats: AudioFormat[];
  analysisDepth: 'basic' | 'deep';
}

export interface AISingerConfig {
  id: string;
  name: string;
  voice: VocalStyle;
  languages: Language[];
}

export interface StyleTransferConfig {
  enabled: boolean;
  intensity: number;
  preserveVocals: boolean;
}

export interface BasicModeConfig {
  simplePrompt: boolean;
  presetStyles: MusicStyle[];
  maxDuration: number;
}

export interface AdvancedModeConfig {
  customInstruments: boolean;
  tempoControl: boolean;
  keyControl: boolean;
  structureControl: boolean;
}

export interface MurekaIntegration {
  models: {
    v6: MurekaV6Config;
    o1: MurekaO1Config;
  };
  features: {
    multiLanguageSupport: Language[];
    customVocalization: VocalStyle[];
    referenceTrack: ReferenceTrackConfig;
    aiSingers: AISingerConfig[];
    styleTransfer: StyleTransferConfig;
  };
  modes: {
    basic: BasicModeConfig;
    advanced: AdvancedModeConfig;
  };
}

export interface MurekaRequest {
  mode: 'basic' | 'advanced';
  prompt?: string;
  lyrics?: string;
  language: Language;
  referenceTrack?: File | string;
  aiSinger?: string;
  style?: MusicStyle;
  duration?: number;
  customizations?: {
    tempo?: number;
    key?: string;
    instruments?: string[];
    mood?: string;
  };
}

// Suno API Types
export interface SunoV35Config {
  version: 'chirp-v3-5';
  features: string[];
}

export interface SunoV4Config {
  version: 'chirp-v4';
  features: string[];
  enhanced: boolean;
}

export interface MusicGenerationConfig {
  maxDuration: number;
  outputFormats: AudioFormat[];
}

export interface LyricsGenerationConfig {
  autoGenerate: boolean;
  languages: Language[];
  styles: string[];
}

export interface WAVConversionConfig {
  quality: 'standard' | 'high' | 'lossless';
  sampleRate: number;
}

export interface VocalRemovalConfig {
  quality: 'basic' | 'advanced';
  preserveHarmonies: boolean;
}

export interface VideoGenerationConfig {
  enabled: boolean;
  templates: string[];
  maxDuration: number;
}

export interface StreamingConfig {
  enabled: boolean;
  chunkSize: number;
  quality: string;
}

export interface SunoIntegration {
  models: {
    'chirp-v3-5': SunoV35Config;
    'chirp-v4': SunoV4Config;
  };
  features: {
    musicGeneration: MusicGenerationConfig;
    lyricsGeneration: LyricsGenerationConfig;
    wavConversion: WAVConversionConfig;
    vocalRemoval: VocalRemovalConfig;
    musicVideoGeneration: VideoGenerationConfig;
    streamingOutput: StreamingConfig;
  };
}

export interface SunoRequest {
  model: 'chirp-v3-5' | 'chirp-v4';
  prompt?: string;
  lyrics?: string;
  customMode: boolean;
  makeInstrumental: boolean;
  tags?: string[];
  continueFrom?: string;
  callbackUrl?: string;
}

// Unified API Types
export interface SongStructure {
  intro: boolean;
  verse: number;
  chorus: number;
  bridge: boolean;
  outro: boolean;
}

export interface UnifiedMusicRequest {
  provider: Provider;
  prompt: string;
  options: {
    style?: string;
    mood?: string;
    genre?: string;
    duration?: number;
    language?: string;
    vocals?: boolean;
    referenceTrack?: string;
  };
  advanced?: {
    tempo?: number;
    key?: string;
    instruments?: string[];
    structure?: SongStructure;
  };
}

export interface MusicGenerationResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  duration?: number;
  metadata: {
    title?: string;
    artist?: string;
    genre?: string;
    mood?: string;
    bpm?: number;
    key?: string;
    generated_at: Date;
    provider: Provider;
  };
  progress?: number;
  error?: string;
}

export interface ExtensionOptions {
  duration: number;
  fadeIn: boolean;
  preserveStyle: boolean;
}

export interface RemixOptions {
  style?: string;
  tempo?: number;
  instruments?: string[];
  preserveVocals: boolean;
}

export interface ConversionResult {
  id: string;
  format: AudioFormat;
  url: string;
  size: number;
}

export interface SeparationComponents {
  vocals: boolean;
  instruments: boolean;
  bass: boolean;
  drums: boolean;
}

export interface SeparationResult {
  id: string;
  components: {
    [key: string]: string; // component name -> url
  };
}

export interface UnifiedMusicAPI {
  generate(request: UnifiedMusicRequest): Promise<MusicGenerationResult>;
  extend(trackId: string, options: ExtensionOptions): Promise<MusicGenerationResult>;
  remix(trackId: string, options: RemixOptions): Promise<MusicGenerationResult>;
  convert(trackId: string, format: AudioFormat): Promise<ConversionResult>;
  separate(trackId: string, components: SeparationComponents): Promise<SeparationResult>;
}

// Track and Library Types
export interface Track {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  url: string;
  genre?: string;
  mood?: string;
  bpm?: number;
  key?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  provider: Provider;
  likes: number;
  plays: number;
  owner: {
    id: string;
    username: string;
    avatar?: string;
  };
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: {
    id: string;
    username: string;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'in_progress' | 'completed';
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  children: Folder[];
  tracks: Track[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}