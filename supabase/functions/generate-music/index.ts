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
    
    // НЕ обновляем прогресс здесь - делаем это только в конкретных провайдерах
    
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
      // Create track record
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
    prompt: prompt,
    style: style, // Correct parameter name (not tags)
    title: prompt.slice(0, 80),
    customMode: true, // Required for custom mode
    instrumental: instrumental, // Correct parameter name (not make_instrumental)
    model: model,
    callBackUrl: `https://psqxgksushbaoisbbdir.supabase.co/functions/v1/suno-callback`
  };

  // Add lyrics only if they exist and are not empty string
  if (finalLyrics && finalLyrics.trim()) {
    generateRequest.lyrics = finalLyrics;
  }
  
  console.log('=== CORRECTED API v1/generate REQUEST ===');
  console.log(JSON.stringify(generateRequest, null, 2));
  console.log('Parameters included:', Object.keys(generateRequest));
  console.log('instrumental type:', typeof generateRequest.instrumental, 'value:', generateRequest.instrumental);
  console.log('customMode type:', typeof generateRequest.customMode, 'value:', generateRequest.customMode);
  console.log('Lyrics present:', !!generateRequest.lyrics);

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
      throw new Error(`Suno API error: ${response.status} ${response.statusText}. Response: ${errorText}`);
    }

    return await response.json();
  }, 3, 2000);
  
  console.log('=== SUNO API RESPONSE ===');
  console.log('Response data:', JSON.stringify(result, null, 2));
  
  // Handle Suno API response format: {code: 200, msg: "success", data: {taskId: "..."}}
  if (result.code !== 200) {
    throw new Error(`Suno API error: ${result.msg || result.error || 'Unknown error'}`);
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
          throw new Error('Lyrics generation failed');
        }
      }
    } catch (error) {
      console.warn(`Lyrics polling attempt ${attempts + 1} failed:`, error);
    }
    
    attempts++;
  }
  
  throw new Error('Lyrics generation timed out');
}

function generateTags(style: string, instrumental: boolean): string {
  const baseTags = style.toLowerCase();
  const instrumentalTag = instrumental ? ', instrumental' : ', vocal';
  const qualityTags = ', high quality, professional';
  
  return `${baseTags}${instrumentalTag}${qualityTags}`;
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
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw lastError!;
}

async function pollSunoGeneration(taskId: string, supabaseAdmin: any, jobId: string, finalLyrics?: string) {
  console.log('Starting enhanced polling for generation status with taskId:', taskId);
  
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  if (!sunoApiKey) {
    throw new Error('SUNO_API_KEY not configured');
  }

  let generationResult = null;
  let attempts = 0;
  const maxAttempts = 120; // 10 minutes maximum
  const pollInterval = 5000; // 5 seconds

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    try {
      const statusResponse = await fetch(`https://api.sunoapi.org/api/v1/generate/record-info?taskId=${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        console.log(`Poll attempt ${attempts + 1}:`, JSON.stringify(statusData, null, 2));
        
        // Update job progress based on polling
        const progressPercent = 60 + Math.min(20, (attempts / maxAttempts) * 20);
        await supabaseAdmin
          .from('generation_jobs')
          .update({ progress: Math.round(progressPercent) })
          .eq('id', jobId);
        
        // Handle /api/v1/generate/record-info response structure
        if (statusData.code === 200 && statusData.data?.response) {
          const response = statusData.data.response;
          
          // Check if generation is complete - updated for new API structure
          if (response.status === 'SUCCESS' && response.sunoData && response.sunoData.length > 0) {
            const track = response.sunoData[0];
            
            // Track is ready if it has audio URL
            if (track.audioUrl || track.sourceAudioUrl) {
              console.log('✅ Generation completed! Track ready with audio:', track.audioUrl || track.sourceAudioUrl);
              
               // Save track to storage and create database record immediately
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
              
              generationResult = {
                id: track.id,
                title: track.title,
                audio_url: finalAudioUrl,
                image_url: track.imageUrl || track.sourceImageUrl,
                duration: track.duration,
                lyric: finalLyrics || track.prompt,
                status: 'complete'
              };
              break;
            } else {
              console.log(`Track still processing, no audio URL yet. ID: ${track.id}`);
            }
          }
          
          // Check for older API structure as fallback
          else if (response.status === 'SUCCESS' && response.data && response.data.length > 0) {
            const track = response.data[0];
            
            if (track.status === 'complete' && track.audio_url) {
              generationResult = track;
              break;
            }
            
            if (track.status === 'error') {
              throw new Error(`Suno generation failed: ${track.error_message || 'Unknown error'}`);
            }
            
            console.log(`Track status: ${track.status}, continuing to poll...`);
          }
          
          // Check for failure
          else if (response.status === 'FAILED') {
            throw new Error(`Suno generation failed: ${response.errorMessage || 'Unknown error'}`);
          }
        }
      } else {
        console.warn(`Status check failed: ${statusResponse.status}`);
      }
    } catch (error) {
      console.warn(`Polling attempt ${attempts + 1} failed:`, error.message);
    }
    
    attempts++;
  }

  if (!generationResult) {
    throw new Error('Suno generation timed out after 10 minutes');
  }

  if (!generationResult.audio_url) {
    throw new Error('No audio track generated. API response: ' + JSON.stringify(generationResult));
  }

  return {
    id: generationResult.id || taskId,
    title: generationResult.title || 'Generated Track',
    audioUrl: generationResult.audio_url,
    imageUrl: generationResult.image_url,
    duration: generationResult.duration || 120,
    lyrics: generationResult.lyric
  };
}

async function generateWithMureka(
  prompt: string,
  style: string,
  duration: number,
  instrumental: boolean,
  lyrics?: string
) {
  const murekaApiKey = Deno.env.get('MUREKA_API_KEY');
  
  // If no Mureka API key, fall back to Suno immediately
  if (!murekaApiKey) {
    return await generateMurekaFallback(prompt, style, duration, instrumental, lyrics, 'No Mureka API key');
  }

  try {
    // Try multiple Mureka endpoints in order of preference
    const endpoints = [
      'https://api.mureka.ai/v1/music/generate',
      'https://mureka.ai/api/v1/generate',
      'https://api.mureka.co/v1/music'
    ];
    
    let lastError;
    
    for (const endpoint of endpoints) {
      try {
        const murekaRequest = {
          text: prompt,
          style: style,
          duration: duration,
          instrumental: instrumental,
          language: 'auto'
        };
        
        if (lyrics?.trim()) {
          murekaRequest.lyrics = lyrics;
        }
        
        const response = await retryApiCall(async () => {
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${murekaApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(murekaRequest),
          });
          
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errorText}`);
          }
          
          return await res.json();
        }, 2, 1000);
        
        // Success with this endpoint
        return {
          id: response.id || response.task_id || 'mureka-' + Date.now(),
          title: response.title || prompt.slice(0, 50),
          audioUrl: response.audio_url || response.url || '',
          imageUrl: response.image_url || response.cover_url || '',
          duration: response.duration || duration,
          provider: 'mureka',
          status: response.status || 'completed'
        };
        
      } catch (endpointError) {
        lastError = endpointError;
        continue;
      }
    }
    
    // All endpoints failed
    throw new Error(`All Mureka endpoints failed. Last error: ${lastError?.message}`);
    
  } catch (murekaError) {
    return await generateMurekaFallback(prompt, style, duration, instrumental, lyrics, murekaError.message);
  }
}

async function generateMurekaFallback(prompt: string, style: string, duration: number, instrumental: boolean, lyrics: string | undefined, originalError: string) {
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  
  if (!sunoApiKey) {
    return await generateWithTest(prompt, style, duration, instrumental, lyrics);
  }
  
  try {
    const sunoRequest = {
      prompt: prompt,
      style: style,
      title: prompt.slice(0, 80),
      customMode: true,
      instrumental: instrumental,
      model: 'V4_5',
      callBackUrl: `https://psqxgksushbaoisbbdir.supabase.co/functions/v1/suno-callback`
    };
    
    if (lyrics?.trim()) {
      sunoRequest.lyrics = lyrics;
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
    
    return {
      id: response.data?.taskId || response.data?.id || 'suno-fallback-' + Date.now(),
      title: prompt.slice(0, 50),
      audioUrl: '',
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
      duration: track.duration || 120,
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
