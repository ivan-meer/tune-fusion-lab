import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationRequest {
  prompt: string;
  provider: 'suno' | 'mureka' | 'test';
  model?: string;
  style?: string;
  duration?: number;
  instrumental?: boolean;
  lyrics?: string;
}

interface SunoLyricsResponse {
  success: boolean;
  code?: number;
  data?: {
    taskId: string;
    lyricsData?: Array<{
      text: string;
      title: string;
      status: string;
    }>;
  };
  error?: string;
}

interface SunoGenerationResponse {
  success: boolean;
  code?: number;
  data?: {
    taskId?: string;
    task_id?: string;
    id?: string;
  } | Array<{
    taskId?: string;
    task_id?: string;
    id?: string;
  }>;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = 'https://psqxgksushbaoisbbdir.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      throw new Error('Server configuration error');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Get and verify user JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      prompt,
      provider,
      model,
      style = 'pop',
      duration = 60,
      instrumental = false,
      lyrics
    }: GenerationRequest = await req.json();

    // Ensure boolean values are properly cast
    const isInstrumental = Boolean(instrumental);

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Create generation job record
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        provider,
        model: model || getDefaultModel(provider),
        status: 'pending',
        progress: 0,
        request_params: {
          prompt,
          style,
          duration,
          instrumental: isInstrumental,
          lyrics,
          model
        },
        credits_used: calculateCredits(provider, duration)
      })
      .select()
      .single();

    if (jobError) {
      throw new Error('Failed to create generation job');
    }

    // Process generation asynchronously in background to avoid blocking
    EdgeRuntime.waitUntil(
      processGeneration(jobData.id, provider, model || getDefaultModel(provider), prompt, style, duration, isInstrumental, lyrics, supabaseAdmin)
        .catch(async (generationError) => {
          console.error(`Background generation failed for job ${jobData.id}:`, generationError);
          
          // Update job to failed status
          await supabaseAdmin
            .from('generation_jobs')
            .update({
              status: 'failed',
              progress: 0,
              error_message: generationError.message
            })
            .eq('id', jobData.id);
        })
    );
    
    // Return immediate success response
    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobData.id,
        message: 'Generation started successfully',
        status: 'processing'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    // Log only essential error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        status: error instanceof Error && error.message.includes('Unauthorized') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'suno': return 'V4_5'; // ПРАВИЛЬНАЯ модель Suno V4.5
    case 'mureka': return 'mureka-v6';
    case 'test': return 'test';
    default: return 'V4_5';
  }
}

function calculateCredits(provider: string, duration: number): number {
  switch (provider) {
    case 'suno': return Math.ceil(duration / 30) * 5; // 5 credits per 30 seconds
    case 'mureka': return Math.ceil(duration / 30) * 8; // 8 credits per 30 seconds
    case 'test': return 0;
    default: return 5;
  }
}

async function processGeneration(
  jobId: string,
  provider: string,
  model: string,
  prompt: string,
  style: string,
  duration: number,
  instrumental: boolean,
  lyrics: string | undefined,
  supabaseAdmin: any
) {
  console.log(`=== Starting processGeneration for job ${jobId} ===`);
  console.log('Parameters:', { provider, model, prompt: prompt.slice(0, 50), style, duration, instrumental, hasLyrics: !!lyrics });
  
  try {
    console.log(`Processing generation job: ${jobId}`);
    
    let result;
    console.log('Starting generation with provider:', provider, 'model:', model);
    
    if (provider === 'suno') {
      console.log('Calling optimized generateWithSuno...');
      result = await generateWithSuno(
        jobId,
        model,
        prompt,
        style,
        duration,
        instrumental,
        lyrics,
        supabaseAdmin
      );
    } else if (provider === 'mureka') {
      console.log('Calling generateWithMureka...');
      result = await generateWithMureka(prompt, style, duration, instrumental, lyrics);
    } else if (provider === 'test') {
      console.log('Calling generateWithTest...');
      result = await generateWithTest(prompt, style, duration, instrumental, lyrics);
    } else {
      throw new Error('Invalid provider');
    }
    
    console.log('Generation result:', result);

    // Skip track creation for Suno - it's handled in pollSunoGeneration
    // Only create tracks for other providers
    if (provider !== 'suno') {
      // Validate audio URL before creating track
      if (!result.audioUrl || result.audioUrl.trim() === '') {
        console.warn('⚠️ No valid audio URL - marking job as failed');
        await supabaseAdmin
          .from('generation_jobs')
          .update({
            status: 'failed',
            progress: 0,
            error_message: 'Generated track has no valid audio URL'
          })
          .eq('id', jobId);
        return; // Exit without creating track
      }

      // Create track record only if audio URL is valid
      const { data: trackData, error: trackError } = await supabaseAdmin
        .from('tracks')
        .insert({
          user_id: (await supabaseAdmin.from('generation_jobs').select('user_id').eq('id', jobId).single()).data.user_id,
          title: result.title || prompt.slice(0, 50),
          description: prompt,
          duration: result.duration || duration,
          file_url: result.audioUrl,
          artwork_url: result.imageUrl,
          genre: style,
          provider,
          provider_track_id: result.id,
          generation_params: {
            prompt,
            style,
            duration,
            instrumental,
            lyrics
          },
          lyrics: result.lyrics || lyrics,
          is_public: false
        })
        .select()
        .single();

      if (trackError) {
        console.error('Failed to create track:', trackError);
        throw new Error('Failed to create track');
      }

      // Update job to completed
      await supabaseAdmin
        .from('generation_jobs')
        .update({
          status: 'completed',
          progress: 100,
          track_id: trackData.id,
          response_data: result
        })
        .eq('id', jobId);
    }

    console.log(`Music generation completed successfully for job ${jobId}`);

  } catch (error) {
    console.error(`Error processing generation job ${jobId}:`, error);
    
    // Update job to failed
    await supabaseAdmin
      .from('generation_jobs')
      .update({
        status: 'failed',
        progress: 0,
        error_message: error.message
      })
      .eq('id', jobId);
  }
}

async function generateWithSuno(
  jobId: string,
  model: string,
  prompt: string,
  style: string,
  duration: number,
  instrumental: boolean,
  lyrics: string | undefined,
  supabaseAdmin: any
) {
  console.log('=== Starting optimized generateWithSuno ===');
  console.log('Params:', { prompt, style, duration, instrumental, lyrics });
  
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  console.log('Suno API key present:', !!sunoApiKey);
  
  if (!sunoApiKey) {
    console.error('SUNO_API_KEY not configured');
    throw new Error('SUNO_API_KEY not configured');
  }

  // For vocal tracks, use Suno's built-in lyric generation if lyrics not provided
  let finalLyrics = lyrics;
  let lyricsTaskId = null;
  
  if (!instrumental && !lyrics) {
    console.log('Using Suno built-in lyric generation...');
    
    // Update progress
    await supabaseAdmin
      .from('generation_jobs')
      .update({ status: 'processing', progress: 20 })
      .eq('id', jobId);
    
    try {
      const lyricsResult = await generateLyricsWithSuno(prompt, style);
      finalLyrics = lyricsResult.lyrics;
      lyricsTaskId = lyricsResult.taskId;
      console.log('Generated lyrics with Suno:', finalLyrics);
    } catch (lyricsError) {
      console.warn('Suno lyrics generation failed, proceeding without:', lyricsError.message);
      // Continue without lyrics for instrumental-like generation
    }
  }

  console.log('Generating music with Suno AI...');

  // Update progress
  await supabaseAdmin
    .from('generation_jobs')
    .update({ status: 'processing', progress: 40 })
    .eq('id', jobId);

  // Build official Suno API request payload according to /api/v1/generate spec
  const generateRequest: any = {
    customMode: true, // Required for custom mode
    instrumental: instrumental, // Correct parameter name (not make_instrumental)
    model: model,
    style: style, // Required in custom mode
    title: prompt.slice(0, 80), // Required in custom mode, max 80 chars
    callBackUrl: `https://psqxgksushbaoisbbdir.supabase.co/functions/v1/suno-callback`
  };

  // В кастом режиме:
  // - если instrumental=false: prompt используется как лирика
  // - если instrumental=true: prompt игнорируется
  if (!instrumental) {
    if (finalLyrics && finalLyrics.trim()) {
      // Используем сгенерированную лирику как prompt (который станет лирикой трека)
      generateRequest.prompt = finalLyrics;
    } else {
      // Используем исходный промпт как лирику
      generateRequest.prompt = prompt;
    }
  }
  // Для instrumental треков prompt не нужен в кастом режиме
  
  console.log('=== SUNO API v1/generate REQUEST ===');
  console.log(JSON.stringify(generateRequest, null, 2));
  console.log('Parameters included:', Object.keys(generateRequest));
  console.log('customMode:', generateRequest.customMode);
  console.log('instrumental:', generateRequest.instrumental);
  console.log('model:', generateRequest.model);
  console.log('style length:', generateRequest.style?.length || 0);
  console.log('title length:', generateRequest.title?.length || 0);
  console.log('prompt length:', generateRequest.prompt?.length || 0);
  console.log('Prompt content (first 100 chars):', generateRequest.prompt?.slice(0, 100) || 'N/A');

  const result = await retryApiCall(async () => {
    const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(generateRequest),
    });
    
    console.log('Suno API response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Suno API error response:', errorText);
      
      // Улучшенная обработка ошибок на основе документации
      let errorMessage = `Suno API error: ${response.status}`;
      
      switch (response.status) {
        case 400:
          errorMessage += ' - Bad Request: Parameter error or content violation. Check prompt length limits and required fields.';
          break;
        case 401:
          errorMessage += ' - Unauthorized: Invalid API key.';
          break;
        case 429:
          errorMessage += ' - Rate Limited: Exceeded 20 requests per 10 seconds limit. Please wait before retrying.';
          // Для rate limiting увеличиваем задержку
          throw new Error(errorMessage + ' - Rate limited, retrying with longer delay');
          break;
        case 451:
          errorMessage += ' - Download Failed: Unable to download related files.';
          break;
        case 500:
          errorMessage += ' - Server Error: Try again later.';
          break;
        default:
          errorMessage += ` - ${response.statusText}`;
      }
      
      errorMessage += ` Response: ${errorText}`;
      throw new Error(errorMessage);
    }

    return await response.json();
  }, 3, 2000);
  
  console.log('=== SUNO API RESPONSE ===');
  console.log('Response data:', JSON.stringify(result, null, 2));
  
  // Handle Suno API response format: {code: 200, msg: "success", data: {taskId: "..."}}
  if (result.code !== 200) {
    let errorMessage = `Suno API error (code ${result.code}): ${result.msg || result.error || 'Unknown error'}`;
    
    // Дополнительная обработка специфичных кодов ошибок из документации
    switch (result.code) {
      case 400:
        errorMessage += ' - Parameter error or content policy violation.';
        break;
      case 451:
        errorMessage += ' - File download failed.';
        break;
      case 500:
        errorMessage += ' - Server internal error, please retry.';
        break;
    }
    
    throw new Error(errorMessage);
  }
  
  // Extract task ID from response
  const taskId = extractTaskId(result);
  if (!taskId) {
    console.error('Failed to extract task ID from response:', result);
    console.error('Response structure analysis:');
    console.error('- result.data:', result.data);
    console.error('- typeof result.data:', typeof result.data);
    if (result.data) {
      console.error('- Object.keys(result.data):', Object.keys(result.data));
    }
    throw new Error(`No task ID found in Suno API response: ${JSON.stringify(result)}`);
  }
  
  console.log('Successfully extracted task ID:', taskId);
  
  // Update progress
  await supabaseAdmin
    .from('generation_jobs')
    .update({ status: 'processing', progress: 60 })
    .eq('id', jobId);
  
  // ИСПРАВЛЕНИЕ: pollSunoGeneration теперь сохраняет треки в БД
  const generationResult = await pollSunoGeneration(taskId, supabaseAdmin, jobId, finalLyrics);
  
  return generationResult;
}

async function generateLyricsWithSuno(prompt: string, style: string): Promise<{lyrics: string, taskId: string}> {
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  
  console.log('Generating lyrics with Suno built-in API...');
  
  const lyricsRequest = {
    prompt: prompt, // Используем промпт как тему для генерации лирики
    style: style,
    language: "russian"
  };
  
  const response = await retryApiCall(async () => {
    const res = await fetch('https://api.sunoapi.org/api/v1/lyrics/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(lyricsRequest),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Suno Lyrics API error: ${res.status} ${errorText}`);
    }
    
    return await res.json();
  }, 2, 1000);
  
  console.log('Suno lyrics response:', response);
  
  const taskId = extractTaskId(response);
  if (!taskId) {
    throw new Error('No task ID returned from Suno lyrics API');
  }
  
  // Poll for lyrics completion
  const lyricsResult = await pollSunoLyrics(taskId);
  
  return {
    lyrics: lyricsResult,
    taskId: taskId
  };
}

async function pollSunoLyrics(taskId: string): Promise<string> {
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  let attempts = 0;
  const maxAttempts = 20; // Lyrics generation is usually faster
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const response = await fetch(`https://api.sunoapi.org/api/v1/lyrics/record-info?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Lyrics poll attempt ${attempts + 1}:`, data);
        
        if (data.data?.response?.lyricsData?.[0]?.status === 'complete') {
          return data.data.response.lyricsData[0].text;
        }
        
        if (data.data?.response?.status === 'FAILED') {
          throw new Error('Suno lyrics generation failed');
        }
      }
    } catch (error) {
      console.warn(`Lyrics polling attempt ${attempts + 1} failed:`, error.message);
    }
    
    attempts++;
  }
  
  throw new Error('Lyrics generation timed out');
}

async function pollSunoGeneration(taskId: string, supabaseAdmin: any, jobId: string, finalLyrics?: string) {
  console.log('🔄 Starting polling for Suno generation:', taskId);
  
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  if (!sunoApiKey) {
    throw new Error('SUNO_API_KEY not configured');
  }

  let attempts = 0;
  const maxAttempts = 60; // 5 minutes maximum
  const pollInterval = 5000; // 5 seconds

  while (attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    try {
      const statusResponse = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!statusResponse.ok) {
        console.warn(`❌ Status check failed: ${statusResponse.status}`);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`📊 Poll attempt ${attempts}/${maxAttempts}:`, {
        code: statusData.code,
        status: statusData.data?.response?.status,
        dataExists: !!statusData.data?.response?.sunoData,
        fullResponse: JSON.stringify(statusData, null, 2)
      });
      
      // Update progress in database
      const progressPercent = 60 + Math.min(35, Math.round((attempts / maxAttempts) * 35));
      await supabaseAdmin
        .from('generation_jobs')
        .update({ progress: progressPercent })
        .eq('id', jobId);
      
      // Check response structure
      if (statusData.code === 200 && statusData.data?.response) {
        const response = statusData.data.response;
        
        // Check if generation is complete
        console.log(`🔍 Checking response status: ${response.status}, sunoData exists: ${!!response.sunoData}`);
        
        // Check for tracks in sunoData array (regardless of status field)
        if (response.sunoData && Array.isArray(response.sunoData) && response.sunoData.length > 0) {
          for (const track of response.sunoData) {
            console.log(`🎵 Checking track:`, {
              id: track.id,
              status: track.status,
              hasAudioUrl: !!(track.audioUrl || track.sourceAudioUrl),
              audioUrl: track.audioUrl,
              sourceAudioUrl: track.sourceAudioUrl
            });
            
            // Check if track has audio URL (means it's ready)
            const audioUrl = track.audioUrl || track.sourceAudioUrl;
            if (audioUrl && audioUrl !== '') {
              console.log('✅ Found completed track with audio:', {
                id: track.id,
                title: track.title,
                audioUrl: audioUrl,
                duration: track.duration
              });
              
              // Save track to storage and create database record
              try {
                const finalAudioUrl = await saveTrackToStorage(track, supabaseAdmin);
                const trackRecord = await createTrackRecord(track, finalAudioUrl, jobId, supabaseAdmin, finalLyrics);
                
                // Update job as completed
                await supabaseAdmin
                  .from('generation_jobs')
                  .update({
                    status: 'completed',
                    progress: 100,
                    track_id: trackRecord.id,
                    response_data: statusData.data,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', jobId);
                
                console.log('🎉 Generation completed successfully! Track ID:', trackRecord.id);
                
                return {
                  id: track.id,
                  title: track.title,
                  audioUrl: finalAudioUrl,
                  imageUrl: track.imageUrl || track.sourceImageUrl,
                  duration: track.duration || 120,
                  lyrics: finalLyrics || track.prompt
                };
              } catch (saveError) {
                console.error('❌ Failed to save track:', saveError);
                throw new Error(`Failed to save generated track: ${saveError.message}`);
              }
            } else {
              console.log(`⏳ Track ${track.id} still processing (no audio URL yet)`);
            }
          }
        }
        
        // Check for legacy API structure as fallback
        else if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          const track = response.data[0];
          console.log(`🎵 Checking legacy track:`, {
            id: track.id,
            status: track.status,
            hasAudioUrl: !!(track.audio_url || track.audioUrl),
            audioUrl: track.audio_url || track.audioUrl
          });
          
          if (track.status === 'complete' && (track.audio_url || track.audioUrl)) {
            console.log('✅ Found completed track (legacy format)');
            
            // Convert to new format and save
            const modernTrack = {
              id: track.id,
              title: track.title,
              audioUrl: track.audio_url || track.audioUrl,
              imageUrl: track.image_url || track.imageUrl,
              duration: track.duration,
              prompt: track.prompt
            };
            
            const finalAudioUrl = await saveTrackToStorage(modernTrack, supabaseAdmin);
            const trackRecord = await createTrackRecord(modernTrack, finalAudioUrl, jobId, supabaseAdmin, finalLyrics);
            
            await supabaseAdmin
              .from('generation_jobs')
              .update({
                status: 'completed',
                progress: 100,
                track_id: trackRecord.id,
                response_data: statusData.data,
                updated_at: new Date().toISOString()
              })
              .eq('id', jobId);
            
            return {
              id: track.id,
              title: track.title,
              audioUrl: finalAudioUrl,
              imageUrl: track.image_url || track.imageUrl,
              duration: track.duration || 120,
              lyrics: finalLyrics || track.prompt
            };
          }
          
          if (track.status === 'error') {
            throw new Error(`Suno generation failed: ${track.error_message || 'Unknown error'}`);
          }
        }
        
        // Check for explicit failure in response status
        else if (response.status === 'FAILED') {
          throw new Error(`Suno generation failed: ${response.errorMessage || 'Generation failed'}`);
        }
        
        // Continue polling if no tracks ready yet
        else {
          console.log(`⏳ Generation still in progress - no ready tracks found`);
        }
      }
      
    } catch (error) {
      console.warn(`⚠️ Polling attempt ${attempts} failed:`, error.message);
      // Don't throw immediately - continue polling unless it's the last attempt
      if (attempts >= maxAttempts) {
        throw error;
      }
    }
  }

  // If we get here, we've exhausted all attempts
  throw new Error(`❌ Suno generation timed out after ${maxAttempts} attempts (${(maxAttempts * pollInterval) / 1000 / 60} minutes)`);
}

function extractTaskId(response: any): string | null {
  // Handle Suno API response format: {code: 200, msg: "success", data: {taskId: "..."}}
  if (response.data) {
    if (Array.isArray(response.data) && response.data.length > 0) {
      return response.data[0].taskId || response.data[0].task_id || response.data[0].id;
    } else if (typeof response.data === 'object') {
      return response.data.taskId || response.data.task_id || response.data.id;
    }
  }
  
  // Fallback for other formats
  return response.taskId || response.task_id || response.id || null;
}

async function retryApiCall<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`API call attempt ${attempt} failed:`, error.message);
      
      if (attempt < maxRetries) {
        // Увеличиваем задержку для rate limiting
        let retryDelay = delayMs * attempt;
        
        // Если rate limited, ждем дольше (минимум 10 секунд согласно документации)
        if (error.message.includes('Rate Limited') || error.message.includes('429')) {
          retryDelay = Math.max(10000, retryDelay * 2);
          console.log(`Rate limited, waiting ${retryDelay}ms before retry...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  throw lastError!;
}

// Функция валидации API ключей
async function validateApiKeys() {
  const errors = [];
  
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  const murekaApiKey = Deno.env.get('MUREKA_API_KEY');
  
  if (!sunoApiKey) {
    errors.push('SUNO_API_KEY not configured');
  }
  
  if (!murekaApiKey) {
    console.warn('MUREKA_API_KEY not configured - will use Suno only');
  }
  
  return { errors, hasApiKeys: !!sunoApiKey };
}

// Улучшенная функция генерации с Mureka AI
async function generateWithMureka(
  prompt: string,
  style: string,
  duration: number,
  instrumental: boolean,
  lyrics?: string
) {
  const murekaApiKey = Deno.env.get('MUREKA_API_KEY');
  
  // Валидация API ключа
  if (!murekaApiKey) {
    console.warn('No Mureka API key - falling back to Suno');
    return await generateMurekaFallback(prompt, style, duration, instrumental, lyrics, 'No Mureka API key');
  }

  try {
    console.log('🎵 Generating with Mureka AI API...');
    
    // Корректная структура запроса согласно официальной документации Mureka API
    const murekaRequest: any = {
      lyrics: lyrics || prompt, // ОБЯЗАТЕЛЬНОЕ ПОЛЕ по документации
      model: 'auto', // Используем последнюю модель
      prompt: prompt // Для контроля генерации
    };

    // Удаляем неподдерживаемые поля из старой версии
    // mode, title, style, voice_style, custom_tags, quality, output_format не поддерживаются

    console.log('📤 Mureka request:', JSON.stringify(murekaRequest, null, 2));

    // Исправленный endpoint согласно официальной документации
    const response = await retryApiCall(async () => {
      const res = await fetch('https://platform.mureka.ai/v1/song/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${murekaApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(murekaRequest),
      });
      
      console.log(`📡 Mureka API response status: ${res.status}`);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Mureka API error response:', errorText);
        
        // Более детальная обработка ошибок
        if (res.status === 401) {
          throw new Error('Mureka API: Invalid API key');
        } else if (res.status === 429) {
          throw new Error('Mureka API: Rate limit exceeded');
        } else if (res.status === 402) {
          throw new Error('Mureka API: Insufficient credits');
        } else {
          throw new Error(`Mureka API error: ${res.status} ${errorText}`);
        }
      }
      
      return await res.json();
    }, 3, 2000); // Больше попыток с увеличенной задержкой

    console.log('📥 Mureka API response:', JSON.stringify(response, null, 2));
    
    // Обработка асинхронного ответа от Mureka согласно документации
    const taskId = response.id; // По документации: object.id - Task ID
    
    if (!taskId) {
      console.error('No task ID in response:', response);
      throw new Error('No task ID received from Mureka API');
    }
    
    console.log('✅ Mureka task created:', taskId);
    
    // Запускаем polling для получения результата
    const result = await pollMurekaGeneration(taskId, murekaApiKey);
    
    return {
      id: taskId,
      title: prompt.slice(0, 50),
      audioUrl: result.audio_url || result.url || '', // Поддержка разных форматов ответа
      imageUrl: result.image_url || '',
      duration: duration,
      provider: 'mureka',
      status: result.status || 'completed',
      metadata: {
        original_prompt: prompt,
        style: style,
        instrumental: instrumental,
        generation_time: result.generation_time
      }
    };
    
  } catch (murekaError) {
    console.error('❌ Mureka API failed:', murekaError.message);
    return await generateMurekaFallback(prompt, style, duration, instrumental, lyrics, murekaError.message);
  }
}

// Функция polling для Mureka AI
async function pollMurekaGeneration(taskId: string, apiKey: string, maxAttempts: number = 30): Promise<any> {
  let attempts = 0;
  const baseDelay = 5000; // 5 секунд базовая задержка
  
  while (attempts < maxAttempts) {
    try {
      console.log(`🔄 Polling Mureka task ${taskId}, attempt ${attempts + 1}/${maxAttempts}`);
      
      // Правильный endpoint для получения статуса согласно документации
      const response = await fetch(`https://platform.mureka.ai/v1/song/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Mureka polling error: ${response.status}`);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, baseDelay));
        continue;
      }
      
      const result = await response.json();
      console.log(`📊 Mureka status check:`, result);
      
      // Проверяем статус согласно документации Mureka
      if (result.status === 'completed' && (result.audio_url || result.url)) {
        console.log('✅ Mureka generation completed');
        return result;
      } else if (result.status === 'failed' || result.status === 'error') {
        throw new Error(`Mureka generation failed: ${result.error || 'Unknown error'}`);
      } else if (result.status === 'processing' || result.status === 'pending') {
        // Продолжаем polling с увеличивающейся задержкой
        const delay = Math.min(baseDelay * (1 + attempts * 0.2), 15000);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
      } else {
        console.log(`🔄 Mureka status: ${result.status}, continuing...`);
        await new Promise(resolve => setTimeout(resolve, baseDelay));
        attempts++;
      }
      
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

async function generateMurekaFallback(
  prompt: string,
  style: string,
  duration: number,
  instrumental: boolean,
  lyrics: string | undefined,
  originalError: string
) {
  console.log('Attempting Suno fallback after Mureka failure...');
  
  try {
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    if (!sunoApiKey) {
      throw new Error('No Suno API key available for fallback');
    }
    
    const sunoRequest = {
      customMode: true,
      instrumental: instrumental,
      model: 'V3_5',
      style: style,
      title: prompt.slice(0, 50)
    };
    
    // В кастом режиме prompt используется как лирика если не инструментальный
    if (!instrumental) {
      sunoRequest.prompt = lyrics || prompt;
    }
    
    const response = await retryApiCall(async () => {
      const res = await fetch('https://api.sunoapi.org/api/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sunoRequest),
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Suno fallback failed: ${res.status} ${errorText}`);
      }
      
      return await res.json();
    }, 2, 1000);
    
    // Извлекаем task ID для дальнейшего polling
    const taskId = extractTaskId(response);
    
    if (taskId) {
      // Если есть task ID, запускаем polling для получения реального аудио
      try {
        const sunoResult = await pollSunoGeneration(taskId, null, null, lyrics);
        return {
          id: taskId,
          title: prompt.slice(0, 50),
          audioUrl: sunoResult.audioUrl || '',
          imageUrl: sunoResult.imageUrl || '',
          duration: duration,
          provider: 'suno-fallback',
          status: 'completed',
          fallbackReason: originalError
        };
      } catch (pollingError) {
        console.warn('Suno fallback polling failed:', pollingError.message);
      }
    }
    
    return {
      id: 'suno-fallback-' + Date.now(),
      title: prompt.slice(0, 50),
      audioUrl: '', // Пустой URL - трек недоступен
      imageUrl: '',
      duration: duration,
      provider: 'suno-fallback',
      status: 'processing',
      fallbackReason: originalError
    };
    
  } catch (sunoError) {
    throw new Error(`Both Mureka and Suno APIs failed. Mureka: ${originalError}, Suno: ${sunoError.message}`);
  }
}

async function generateWithTest(
  prompt: string,
  style: string,
  duration: number,
  instrumental: boolean,
  lyrics?: string
) {
  console.log('Generating test track...');
  
  // Simulate realistic API call delay
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Generate more realistic test data
  const trackId = `test_${Date.now()}`;
  const shortPrompt = prompt.slice(0, 30);
  
  return {
    id: trackId,
    title: `Test: ${shortPrompt}${shortPrompt.length < prompt.length ? '...' : ''}`,
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3',
    imageUrl: `https://picsum.photos/300/300?random=${trackId}`,
    duration: duration,
    lyrics: instrumental ? undefined : (lyrics || `Test lyrics for "${shortPrompt}":\n\nVerse 1:\nThis is a test track generated\nFor your music AI application\nThe melody flows like dreams\nIn digital realms\n\nChorus:\nTest track, test track\nPlaying back\nAll systems working\nNothing lacking`)
  };
}

async function saveTrackToStorage(track: any, supabaseAdmin: any): Promise<string> {
  let finalFileUrl = track.audioUrl || track.sourceAudioUrl;
  
  try {
    // Download and save to our storage bucket
    if (finalFileUrl && finalFileUrl.startsWith('http')) {
      console.log('Downloading track from:', finalFileUrl);
      const audioResponse = await fetch(finalFileUrl);
      if (audioResponse.ok) {
        const audioBlob = await audioResponse.arrayBuffer();
        const fileName = `${track.id || Date.now()}.mp3`;
        
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('audio-tracks')
          .upload(fileName, audioBlob, {
            contentType: 'audio/mpeg',
            duplex: 'replace'
          });
        
        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabaseAdmin.storage
            .from('audio-tracks')
            .getPublicUrl(fileName);
          finalFileUrl = publicUrl;
          console.log('✅ Saved audio to storage:', finalFileUrl);
        } else {
          console.warn('⚠️ Storage upload failed:', uploadError);
        }
      } else {
        console.warn('⚠️ Failed to download audio:', audioResponse.statusText);
      }
    }
  } catch (storageError) {
    console.warn('⚠️ Failed to save to storage, using original URL:', storageError);
  }
  
  return finalFileUrl;
}

async function createTrackRecord(track: any, finalAudioUrl: string, jobId: string, supabaseAdmin: any, finalLyrics?: string) {
  // Get job details to get user_id and request params
  const { data: jobData } = await supabaseAdmin
    .from('generation_jobs')
    .select('user_id, request_params')
    .eq('id', jobId)
    .single();
  
  if (!jobData) {
    throw new Error('Job not found for track creation');
  }
  
  const { data: trackRecord, error: trackError } = await supabaseAdmin
    .from('tracks')
    .insert({
      user_id: jobData.user_id,
      title: track.title || jobData.request_params?.prompt?.slice(0, 50) || 'Generated Track',
      description: jobData.request_params?.prompt || '',
      file_url: finalAudioUrl,
      artwork_url: track.imageUrl || track.sourceImageUrl,
      duration: Number(track.duration) || 120,
      provider: 'suno',
      provider_track_id: track.id,
      lyrics: finalLyrics || jobData.request_params?.lyrics || track.prompt,
      genre: jobData.request_params?.style || track.tags || 'pop',
      generation_params: jobData.request_params,
      is_public: false,
      is_commercial: false
    })
    .select()
    .single();

  if (trackError) {
    console.error('❌ Error creating track:', trackError);
    throw new Error(`Failed to save track: ${trackError.message}`);
  }

  console.log('✅ Track record created:', trackRecord.id);
  return trackRecord;
}