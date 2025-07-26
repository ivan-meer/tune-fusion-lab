import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Create generation job record
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        provider,
        model: model || (provider === 'test' ? 'test' : 'chirp-v4'),
        status: 'pending',
        progress: 0,
        request_params: {
          prompt,
          style,
          duration,
          instrumental,
          lyrics,
          model
        },
        credits_used: provider === 'suno' ? 10 : provider === 'mureka' ? 15 : 0
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create generation job:', jobError);
      throw new Error('Failed to create generation job');
    }

    console.log(`Created generation job: ${jobData.id}`);

    // Start background processing without waiting
    EdgeRuntime.waitUntil(processGeneration(jobData.id, provider, model, prompt, style, duration, instrumental, lyrics, supabaseAdmin));
    
    // Return immediate response
    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobData.id,
        message: 'Generation started',
        status: 'pending'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

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
      console.log('Calling generateWithSuno...');
      result = await generateWithSuno({
        prompt,
        provider,
        model,
        style,
        duration,
        instrumental,
        lyrics
      });
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

async function generateWithSuno(request: GenerationRequest) {
  console.log('=== Starting generateWithSuno ===');
  console.log('Request object:', JSON.stringify(request, null, 2));
  
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  console.log('Suno API key present:', !!sunoApiKey);
  
  if (!sunoApiKey) {
    console.error('SUNO_API_KEY not configured');
    throw new Error('SUNO_API_KEY not configured');
  }

  console.log('Generating with Suno AI...');

  // Use correct Suno API request format according to documentation
  const generateRequest = {
    prompt: request.prompt, // Always use prompt as style/performance description
    customMode: !request.instrumental, // Use custom mode for vocal tracks with lyrics
    model: "V4_5", // Updated to V4_5 for better quality
    make_instrumental: request.instrumental || false,
    tags: request.style || "pop", // Style becomes tags
    title: request.prompt.slice(0, 80),
    wait_audio: false,
    callBackUrl: `https://psqxgksushbaoisbbdir.supabase.co/functions/v1/suno-callback`
  };

  // Add lyrics only for vocal tracks
  if (!request.instrumental && request.lyrics) {
    generateRequest.lyrics = request.lyrics;
  }
  
  console.log('Request payload:', JSON.stringify(generateRequest, null, 2));

  // Use the correct Suno API endpoint
  const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sunoApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(generateRequest),
  });
  
  console.log('Suno API response status:', response.status, response.statusText);
  console.log('Suno API response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Suno API error response status:', response.status);
    console.error('Suno API error response body:', errorText);
    throw new Error(`Suno API error: ${response.status} ${response.statusText}. Response: ${errorText}`);
  }

  const data = await response.json();
  console.log('=== SUNO API RESPONSE START ===');
  console.log('Response status:', response.status);
  console.log('Response data:', JSON.stringify(data, null, 2));
  console.log('=== SUNO API RESPONSE END ===');
  
  // Handle successful response with success flag
  if (data.success === true || data.code === 200) {
    console.log('Suno API returned success');
    
    // Try multiple ways to extract task ID
    let taskId = null;
    if (data.data) {
      taskId = data.data.task_id || data.data.id || data.data.taskId;
      if (Array.isArray(data.data) && data.data.length > 0) {
        taskId = data.data[0].task_id || data.data[0].id || data.data[0].taskId;
      }
    }
    if (!taskId) {
      taskId = data.task_id || data.id || data.taskId;
    }
    
    console.log('Extracted task ID:', taskId);
    
    if (!taskId) {
      console.error('=== NO TASK ID FOUND ===');
      console.error('Full response structure:');
      console.error('Type of data:', typeof data);
      console.error('Keys in data:', Object.keys(data));
      if (data.data) {
        console.error('Type of data.data:', typeof data.data);
        if (Array.isArray(data.data)) {
          console.error('data.data is array with length:', data.data.length);
          if (data.data.length > 0) {
            console.error('Keys in data.data[0]:', Object.keys(data.data[0]));
          }
        } else {
          console.error('Keys in data.data:', Object.keys(data.data));
        }
      }
      throw new Error(`No task ID found in Suno API response: ${JSON.stringify(data)}`);
    }
    
    console.log('Successfully extracted task ID:', taskId);
    return await pollSunoGeneration(taskId);
    
  } else {
    console.error('Suno API returned error:', data);
    throw new Error(`Suno API error: ${data.error || data.message || data.msg || 'Unknown error'}`);
  }
}

async function pollSunoGeneration(taskId: string) {
  console.log('Starting to poll for generation status with taskId:', taskId);
  
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  if (!sunoApiKey) {
    throw new Error('SUNO_API_KEY not configured');
  }

  let generationResult = null;
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between polls
    
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
      
      if (statusData.success && statusData.data && statusData.data.length > 0) {
        const track = statusData.data[0];
        
        if (track.status === 'completed' && track.audio_url) {
          generationResult = track;
          break;
        }
        
        if (track.status === 'failed') {
          throw new Error(`Suno generation failed: ${track.error_message || 'Unknown error'}`);
        }
      }
    }
    
    attempts++;
  }

  if (!generationResult) {
    throw new Error('Suno generation timed out');
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
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Sevish_-__nbsp_.mp3', // Working test audio
    imageUrl: `https://picsum.photos/300/300?random=${trackId}`, // Random placeholder image
    duration: duration,
    lyrics: instrumental ? undefined : (lyrics || `Test lyrics for "${shortPrompt}":\n\nVerse 1:\nThis is a test track generated\nFor your music AI application\nThe melody flows like dreams\nIn digital realms\n\nChorus:\nTest track, test track\nPlaying back\nAll systems working\nNothing lacking`)
  };
}