// Унифицированный API слой для музыкальной генерации

import type { 
  UnifiedMusicRequest, 
  MusicGenerationResult, 
  MurekaRequest, 
  SunoRequest,
  ExtensionOptions,
  RemixOptions,
  ConversionResult,
  SeparationResult,
  SeparationComponents,
  AudioFormat,
  Provider
} from '@/types/music';

// Базовый класс для API клиентов
abstract class BaseAPIClient {
  protected baseUrl: string;
  protected apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  protected async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

// Mureka AI API Client
export class MurekaAPIClient extends BaseAPIClient {
  constructor(apiKey: string) {
    super('https://api.mureka.ai/v1', apiKey);
  }

  async generate(request: MurekaRequest): Promise<MusicGenerationResult> {
    try {
      // В реальном приложении здесь будет вызов к Mureka API
      console.log('Generating with Mureka AI:', request);
      
      // Симуляция API вызова
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        id: `mureka_${Date.now()}`,
        status: 'completed',
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: request.duration || 180,
        metadata: {
          title: `Mureka Generated - ${request.prompt?.slice(0, 20)}...`,
          artist: 'Mureka AI',
          genre: request.style,
          mood: request.customizations?.mood,
          bpm: request.customizations?.tempo,
          key: request.customizations?.key,
          generated_at: new Date(),
          provider: 'mureka'
        }
      };
    } catch (error) {
      console.error('Mureka API Error:', error);
      throw error;
    }
  }

  async continueTrack(trackId: string, duration: number): Promise<MusicGenerationResult> {
    return this.request(`/tracks/${trackId}/continue`, {
      method: 'POST',
      body: JSON.stringify({ duration })
    });
  }

  async styleTransfer(trackId: string, targetStyle: string): Promise<MusicGenerationResult> {
    return this.request(`/tracks/${trackId}/style-transfer`, {
      method: 'POST',
      body: JSON.stringify({ target_style: targetStyle })
    });
  }
}

// Suno API Client  
export class SunoAPIClient extends BaseAPIClient {
  constructor(apiKey: string) {
    super('https://api.suno.ai/v1', apiKey);
  }

  async generate(request: SunoRequest): Promise<MusicGenerationResult> {
    try {
      console.log('Generating with Suno AI:', request);
      
      // Симуляция API вызова
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        id: `suno_${Date.now()}`,
        status: 'completed',
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        duration: 240, // Suno треки обычно длиннее
        metadata: {
          title: `Suno Generated - ${request.prompt?.slice(0, 20)}...`,
          artist: 'Suno AI',
          genre: request.tags?.[0],
          generated_at: new Date(),
          provider: 'suno'
        }
      };
    } catch (error) {
      console.error('Suno API Error:', error);
      throw error;
    }
  }

  async extendTrack(trackId: string, continueFrom: string): Promise<MusicGenerationResult> {
    return this.request(`/tracks/${trackId}/extend`, {
      method: 'POST',
      body: JSON.stringify({ continue_from: continueFrom })
    });
  }

  async removeVocals(trackId: string): Promise<SeparationResult> {
    return this.request(`/tracks/${trackId}/vocal-removal`, {
      method: 'POST'
    });
  }

  async generateMusicVideo(trackId: string): Promise<{ videoUrl: string }> {
    return this.request(`/tracks/${trackId}/video`, {
      method: 'POST'
    });
  }
}

// Унифицированный музыкальный API
export class UnifiedMusicAPI {
  private murekaClient: MurekaAPIClient;
  private sunoClient: SunoAPIClient;

  constructor(murekaApiKey: string = '', sunoApiKey: string = '') {
    this.murekaClient = new MurekaAPIClient(murekaApiKey);
    this.sunoClient = new SunoAPIClient(sunoApiKey);
  }

  async generate(request: UnifiedMusicRequest): Promise<MusicGenerationResult> {
    const provider = this.selectOptimalProvider(request);
    
    switch (provider) {
      case 'mureka':
        return this.generateWithMureka(request);
      case 'suno':
        return this.generateWithSuno(request);
      case 'hybrid':
        return this.generateHybrid(request);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async extend(trackId: string, options: ExtensionOptions): Promise<MusicGenerationResult> {
    // Определяем провайдера по ID трека
    const provider = this.getProviderFromTrackId(trackId);
    
    if (provider === 'mureka') {
      return this.murekaClient.continueTrack(trackId, options.duration);
    } else if (provider === 'suno') {
      return this.sunoClient.extendTrack(trackId, '');
    }
    
    throw new Error('Provider not supported for track extension');
  }

  async remix(trackId: string, options: RemixOptions): Promise<MusicGenerationResult> {
    const provider = this.getProviderFromTrackId(trackId);
    
    if (provider === 'mureka' && options.style) {
      return this.murekaClient.styleTransfer(trackId, options.style);
    }
    
    // Для других случаев создаем новый трек с параметрами ремикса
    const remixRequest: UnifiedMusicRequest = {
      provider: 'mureka',
      prompt: `Remix of track ${trackId}`,
      options: {
        style: options.style,
        vocals: options.preserveVocals
      },
      advanced: {
        tempo: options.tempo,
        instruments: options.instruments
      }
    };
    
    return this.generate(remixRequest);
  }

  async convert(trackId: string, format: AudioFormat): Promise<ConversionResult> {
    // Симуляция конвертации
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      id: `${trackId}_${format}`,
      format,
      url: `https://api.example.com/tracks/${trackId}.${format}`,
      size: 1024 * 1024 * 5 // 5MB mock size
    };
  }

  async separate(trackId: string, components: SeparationComponents): Promise<SeparationResult> {
    const provider = this.getProviderFromTrackId(trackId);
    
    if (provider === 'suno' && components.vocals) {
      return this.sunoClient.removeVocals(trackId);
    }
    
    // Общая логика сепарации
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result: SeparationResult = {
      id: `${trackId}_separated`,
      components: {}
    };
    
    if (components.vocals) result.components.vocals = `${trackId}_vocals.wav`;
    if (components.instruments) result.components.instruments = `${trackId}_instruments.wav`;
    if (components.bass) result.components.bass = `${trackId}_bass.wav`;
    if (components.drums) result.components.drums = `${trackId}_drums.wav`;
    
    return result;
  }

  private selectOptimalProvider(request: UnifiedMusicRequest): Provider {
    // Если провайдер указан явно, используем его
    if (request.provider !== 'hybrid') {
      return request.provider;
    }
    
    // Логика выбора оптимального провайдера
    const { options, advanced } = request;
    
    // Mureka лучше для:
    // - Кастомной вокализации
    // - Референс треков
    // - Продвинутых настроек инструментов
    if (advanced?.instruments?.length || options.referenceTrack) {
      return 'mureka';
    }
    
    // Suno лучше для:
    // - Текстовых промптов
    // - Быстрой генерации
    // - Вокальных треков с лирикой
    if (options.vocals && request.prompt.length > 50) {
      return 'suno';
    }
    
    // По умолчанию используем Mureka
    return 'mureka';
  }

  private async generateWithMureka(request: UnifiedMusicRequest): Promise<MusicGenerationResult> {
    const murekaRequest: MurekaRequest = {
      mode: request.advanced ? 'advanced' : 'basic',
      prompt: request.prompt,
      language: 'en', // TODO: Определять из настроек пользователя
      style: request.options.genre as any,
      duration: request.options.duration,
      customizations: {
        tempo: request.advanced?.tempo,
        key: request.advanced?.key,
        instruments: request.advanced?.instruments,
        mood: request.options.mood
      }
    };
    
    return this.murekaClient.generate(murekaRequest);
  }

  private async generateWithSuno(request: UnifiedMusicRequest): Promise<MusicGenerationResult> {
    const sunoRequest: SunoRequest = {
      model: 'chirp-v4',
      prompt: request.prompt,
      customMode: !!request.advanced,
      makeInstrumental: !request.options.vocals,
      tags: [
        request.options.genre,
        request.options.mood,
        ...(request.advanced?.instruments || [])
      ].filter(Boolean) as string[]
    };
    
    return this.sunoClient.generate(sunoRequest);
  }

  private async generateHybrid(request: UnifiedMusicRequest): Promise<MusicGenerationResult> {
    // Гибридная генерация: используем оба провайдера и комбинируем результаты
    // Это продвинутая функция для будущих версий
    
    try {
      const [murekaResult, sunoResult] = await Promise.all([
        this.generateWithMureka(request),
        this.generateWithSuno(request)
      ]);
      
      // Логика комбинирования результатов
      // Пока возвращаем лучший результат
      return murekaResult.metadata.bpm ? murekaResult : sunoResult;
    } catch (error) {
      // Fallback на один из провайдеров
      return this.generateWithMureka(request);
    }
  }

  private getProviderFromTrackId(trackId: string): Provider {
    if (trackId.startsWith('mureka_')) return 'mureka';
    if (trackId.startsWith('suno_')) return 'suno';
    return 'mureka'; // default
  }
}

// Singleton instance
export const musicAPI = new UnifiedMusicAPI();

// Функции для настройки API ключей
export const configureMurekaAPI = (apiKey: string) => {
  // TODO: Обновить ключ в существующем instance
  console.log('Mureka API key configured');
};

export const configureSunoAPI = (apiKey: string) => {
  // TODO: Обновить ключ в существующем instance
  console.log('Suno API key configured');
};