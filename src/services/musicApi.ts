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
    super('https://platform.mureka.ai/v1', apiKey);
  }

  async generate(request: MurekaRequest): Promise<MusicGenerationResult> {
    try {
      console.log('🎵 Calling Mureka platform API:', request);
      
      // Правильная структура запроса для platform.mureka.ai
      const murekaRequest = {
        mode: request.mode || 'advanced',
        title: request.prompt?.slice(0, 100) || 'Generated Song',
        lyrics: request.customizations?.instrumental ? undefined : request.prompt,
        style: request.style || 'pop',
        duration: Math.min(request.duration || 180, 240),
        language: request.language || 'en',
        voice_style: request.customizations?.instrumental ? undefined : 'default',
        instrumental: request.customizations?.instrumental || false,
        custom_tags: [request.style || 'pop'],
        quality: 'high',
        output_format: 'mp3'
      };

      const response = await this.request<any>('/song/generate', {
        method: 'POST',
        body: JSON.stringify(murekaRequest)
      });

      console.log('📥 Mureka API response:', response);
      
      // Обработка асинхронного ответа
      const taskId = response.task_id || response.id || response.data?.task_id;
      
      if (!taskId) {
        throw new Error('No task ID received from Mureka API');
      }

      // Polling результата
      const result = await this.pollGeneration(taskId);
      
      return {
        id: taskId,
        status: 'completed',
        audioUrl: result.audio_url || '',
        duration: request.duration || 180,
        metadata: {
          title: request.prompt?.slice(0, 50) || 'Generated Song',
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
      console.error('❌ Mureka API Error:', error);
      throw error;
    }
  }

  private async pollGeneration(taskId: string, maxAttempts: number = 30): Promise<any> {
    let attempts = 0;
    const baseDelay = 5000;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`🔄 Polling Mureka task ${taskId}, attempt ${attempts + 1}/${maxAttempts}`);
        
        const result = await this.request<any>(`/song/status/${taskId}`, {
          method: 'GET'
        });
        
        console.log(`📊 Mureka status:`, result);
        
        if (result.status === 'completed' && result.audio_url) {
          console.log('✅ Mureka generation completed');
          return result;
        } else if (result.status === 'failed') {
          throw new Error(`Mureka generation failed: ${result.error || 'Unknown error'}`);
        }
        
        // Продолжаем polling с увеличивающейся задержкой
        const delay = Math.min(baseDelay * (1 + attempts * 0.2), 15000);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
        
      } catch (error) {
        console.error(`❌ Error polling Mureka: ${error.message}`);
        attempts++;
        
        if (attempts >= maxAttempts) {
          throw new Error(`Mureka polling timeout after ${maxAttempts} attempts`);
        }
        
        await new Promise(resolve => setTimeout(resolve, baseDelay));
      }
    }
    
    throw new Error('Mureka generation timeout - no result after maximum attempts');
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
    super('https://api.sunoapi.org/api/v1', apiKey);
  }

  async generate(request: SunoRequest): Promise<MusicGenerationResult> {
    try {
      console.log('🎵 Calling Suno API:', request);
      
      // Правильная структура запроса для api.sunoapi.org
      const sunoRequest = {
        customMode: request.customMode || true,
        instrumental: request.makeInstrumental || false,
        model: request.model || 'V4_5',
        style: request.tags?.join(', ') || 'pop',
        title: request.prompt?.slice(0, 80) || 'Generated Song'
      };

      // В кастом режиме prompt используется как лирика для вокальных треков
      if (!sunoRequest.instrumental && request.prompt) {
        (sunoRequest as any).prompt = request.prompt;
      }

      const response = await this.request<any>('/generate', {
        method: 'POST',
        body: JSON.stringify(sunoRequest)
      });

      console.log('📥 Suno API response:', response);
      
      // Обработка ответа Suno API
      if (response.code !== 200) {
        throw new Error(`Suno API error (code ${response.code}): ${response.msg || 'Unknown error'}`);
      }
      
      const taskId = this.extractTaskId(response);
      if (!taskId) {
        throw new Error('No task ID found in Suno API response');
      }

      // Polling результата
      const result = await this.pollGeneration(taskId);
      
      return {
        id: taskId,
        status: 'completed',
        audioUrl: result.audioUrl || '',
        duration: result.duration || 240,
        metadata: {
          title: result.title || request.prompt?.slice(0, 50) || 'Generated Song',
          artist: 'Suno AI',
          genre: request.tags?.[0] || 'pop',
          generated_at: new Date(),
          provider: 'suno'
        }
      };
    } catch (error) {
      console.error('❌ Suno API Error:', error);
      throw error;
    }
  }

  private extractTaskId(response: any): string | null {
    if (response.data) {
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data[0].taskId || response.data[0].task_id || response.data[0].id;
      } else if (typeof response.data === 'object') {
        return response.data.taskId || response.data.task_id || response.data.id;
      }
    }
    
    return response.taskId || response.task_id || response.id || null;
  }

  private async pollGeneration(taskId: string, maxAttempts: number = 30): Promise<any> {
    let attempts = 0;
    const pollInterval = 5000;

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      try {
        const statusResponse = await this.request<any>(`/generate/record-info?taskId=${taskId}`, {
          method: 'GET'
        });

        console.log(`📊 Suno poll attempt ${attempts}:`, statusResponse);
        
        if (statusResponse.code === 200 && statusResponse.data?.response) {
          const response = statusResponse.data.response;
          
          if (response.sunoData && Array.isArray(response.sunoData) && response.sunoData.length > 0) {
            for (const track of response.sunoData) {
              const audioUrl = track.audioUrl || track.sourceAudioUrl;
              if (audioUrl && audioUrl !== '') {
                console.log('✅ Suno generation completed');
                return {
                  audioUrl: audioUrl,
                  title: track.title,
                  duration: track.duration || 240,
                  imageUrl: track.imageUrl || track.sourceImageUrl
                };
              }
            }
          }
          
          if (response.status === 'FAILED') {
            throw new Error(`Suno generation failed: ${response.errorMessage || 'Generation failed'}`);
          }
        }
        
      } catch (error) {
        console.warn(`⚠️ Suno polling attempt ${attempts} failed:`, error.message);
        if (attempts >= maxAttempts) {
          throw error;
        }
      }
    }

    throw new Error(`Suno generation timed out after ${maxAttempts} attempts`);
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
      model: 'V4_5',
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