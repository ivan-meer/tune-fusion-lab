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
    console.log('Starting music generation...');
    
    // Create Supabase client with service role key
    const supabaseUrl = 'https://psqxgksushbaoisbbdir.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
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
      console.error('Authorization failed:', userError);
      throw new Error('Unauthorized');
    }

    console.log(`Starting generation for user: ${user.id}`);

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
      console.error('Failed to create generation job:', jobError);
      throw new Error('Failed to create generation job');
    }

    console.log(`Created generation job: ${jobData.id}`);

    // Process generation synchronously like the successful 14:54 call
    try {
      await processGeneration(jobData.id, provider, model || getDefaultModel(provider), prompt, style, duration, isInstrumental, lyrics, supabaseAdmin);
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          jobId: jobData.id,
          message: 'Generation completed successfully',
          status: 'completed'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (generationError) {
      console.error(`Generation failed for job ${jobData.id}:`, generationError);
      
      // Update job to failed status
      await supabaseAdmin
        .from('generation_jobs')
        .update({
          status: 'failed',
          progress: 0,
          error_message: generationError.message
        })
        .eq('id', jobData.id);
      
      throw generationError;
    }

  } catch (error) {
    console.error('Error in generate-music function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during music generation'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function getDefaultModel(provider: string): string {
  switch (provider) {
    case 'suno': return 'V4_5';
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
    
    // Update job status to processing
    await supabaseAdmin
      .from('generation_jobs')
      .update({ status: 'processing', progress: 10 })
      .eq('id', jobId);

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

    // Update job progress
    await supabaseAdmin
      .from('generation_jobs')
      .update({ status: 'processing', progress: 80 })
      .eq('id', jobId);

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

  // Simple Suno API request like the successful 14:54 call
  const generateRequest = {
    prompt: prompt,
    title: prompt.slice(0, 80),
    model: model,
    make_instrumental: instrumental === true, // Always boolean
    customMode: !instrumental && !!finalLyrics, // Always boolean  
    callBackUrl: `https://psqxgksushbaoisbbdir.supabase.co/functions/v1/suno-callback`
  };
  
  // Add lyrics if provided
  if (!instrumental && finalLyrics) {
    generateRequest.lyrics = finalLyrics;
  }
  
  console.log('Optimized request payload:', JSON.stringify(generateRequest, null, 2));

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
  
  const generationResult = await pollSunoGeneration(taskId, supabaseAdmin, jobId);
  
  // Include generated lyrics in result
  if (finalLyrics && !generationResult.lyrics) {
    generationResult.lyrics = finalLyrics;
  }
  
  return generationResult;
}

async function generateLyricsWithSuno(prompt: string, style: string): Promise<{lyrics: string, taskId: string}> {
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  
  console.log('Generating lyrics with Suno built-in API...');
  
  const lyricsRequest = {
    prompt: `Create song lyrics for: ${prompt}`,
    style: style,
    language: "russian"
  };
  
  const response = await retryApiCall(async () => {
    const res = await fetch('https://api.sunoapi.org/api/v1/generate/lyric', {
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

async function pollSunoGeneration(taskId: string, supabaseAdmin: any, jobId: string) {
  console.log('Starting enhanced polling for generation status with taskId:', taskId);
  
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  if (!sunoApiKey) {
    throw new Error('SUNO_API_KEY not configured');
  }

  let generationResult = null;
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes maximum
  const pollInterval = 5000; // 5 seconds

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    try {
      const statusResponse = await fetch(`https://api.sunoapi.org/api/v1/get?ids=${taskId}`, {
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
        
        if (statusData.success && statusData.data && statusData.data.length > 0) {
          const track = statusData.data[0];
          
          if (track.status === 'completed' && track.audio_url) {
            generationResult = track;
            break;
          }
          
          if (track.status === 'failed') {
            throw new Error(`Suno generation failed: ${track.error_message || 'Unknown error'}`);
          }
          
          console.log(`Track status: ${track.status}, continuing to poll...`);
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
    throw new Error('Suno generation timed out after 5 minutes');
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
  if (!murekaApiKey) {
    throw new Error('MUREKA_API_KEY not configured');
  }

  console.log('Generating with Mureka AI...');

  const response = await fetch('https://api.mureka.com/v1/music/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${murekaApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: prompt,
      genre: style,
      duration_seconds: duration,
      instrumental_only: instrumental,
      lyrics: instrumental ? undefined : lyrics,
      model: 'mureka-v6'
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mureka API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  
  let generationResult = data;
  let attempts = 0;
  const maxAttempts = 60;

  while (generationResult.status !== 'completed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const statusResponse = await fetch(`https://api.mureka.com/v1/music/status/${data.task_id}`, {
      headers: {
        'Authorization': `Bearer ${murekaApiKey}`,
      },
    });

    if (statusResponse.ok) {
      generationResult = await statusResponse.json();
    }
    
    attempts++;
  }

  if (generationResult.status !== 'completed') {
    throw new Error('Mureka generation timed out');
  }

  return {
    id: generationResult.task_id,
    title: generationResult.metadata?.title || prompt.slice(0, 50),
    audioUrl: generationResult.output.audio_url,
    imageUrl: generationResult.output.cover_url,
    duration: generationResult.output.duration,
    lyrics: generationResult.output.lyrics
  };
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
