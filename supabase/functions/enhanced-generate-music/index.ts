// ============================================================================
// ENHANCED MUSIC GENERATION WITH STREAMING PROGRESS & PROPER PROMPT HANDLING
// ============================================================================

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Enhanced generation request with proper prompt vs lyrics separation
 * CRITICAL: prompt = description/theme, NOT song lyrics!
 */
interface EnhancedGenerationRequest {
  // Core user input
  prompt: string;                // USER DESCRIPTION (not lyrics!)
  provider: 'suno' | 'mureka' | 'test';
  model?: string;
  
  // Enhanced/generated content
  enhancedPrompt?: string;       // AI-improved description  
  styleDescription?: string;     // Enhanced style details
  generatedLyrics?: string;      // Separate generated lyrics
  
  // Configuration
  style?: string;
  duration?: number;
  instrumental?: boolean;
  language?: string;
  
  // Draft/variation system
  parentTrackId?: string;
  variationType?: 'manual' | 'auto_improve' | 'style_change';
  isDraft?: boolean;
}

/**
 * Progress tracking states with detailed steps
 */
const GENERATION_STEPS = {
  CREDITS_CHECK: { progress: 5, message: 'Проверяем доступные кредиты' },
  PROMPT_ENHANCE: { progress: 15, message: 'Улучшаем описание с помощью ИИ' },
  LYRICS_GENERATE: { progress: 30, message: 'Генерируем уникальный текст песни' },
  STYLE_ENHANCE: { progress: 45, message: 'Создаем детальное описание стиля' },
  MUSIC_GENERATE: { progress: 70, message: 'ИИ создает музыкальную композицию' },
  AUDIO_PROCESS: { progress: 85, message: 'Обрабатываем и сохраняем аудио' },
  FINALIZE: { progress: 100, message: 'Завершаем создание трека' }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🎵 Starting enhanced music generation...');
    
    // Initialize Supabase admin client
    const supabaseUrl = 'https://psqxgksushbaoisbbdir.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not configured');
      throw new Error('Server configuration error');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      console.error('❌ Authorization failed:', userError);
      throw new Error('Unauthorized');
    }

    console.log(`✅ User authenticated: ${user.id}`);

    // Parse enhanced request
    const request: EnhancedGenerationRequest = await req.json();
    
    console.log('📝 Enhanced generation request:');
    console.log('- Original prompt (description):', request.prompt);
    console.log('- Enhanced prompt:', request.enhancedPrompt);
    console.log('- Style description:', request.styleDescription);
    console.log('- Has generated lyrics:', !!request.generatedLyrics);
    console.log('- Is draft:', request.isDraft);
    console.log('- Parent track ID:', request.parentTrackId);

    // Validate request
    if (!request.prompt) {
      throw new Error('Prompt (description) is required');
    }

    // STEP 1: Credits check
    console.log('💳 STEP 1: Checking credits...');
    
    const creditsNeeded = calculateCredits(request.provider, request.duration || 60);
    // TODO: Implement actual credit checking
    console.log(`Credits needed: ${creditsNeeded}`);

    // Create enhanced generation job
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('generation_jobs')
      .insert({
        user_id: user.id,
        provider: request.provider,
        model: request.model || getDefaultModel(request.provider),
        status: 'processing',  // Start as processing immediately
        progress: GENERATION_STEPS.CREDITS_CHECK.progress,
        request_params: {
          // Store original user input separately from processed content
          originalPrompt: request.prompt,
          enhancedPrompt: request.enhancedPrompt,
          styleDescription: request.styleDescription,
          generatedLyrics: request.generatedLyrics,
          style: request.style,
          duration: request.duration || 60,
          instrumental: Boolean(request.instrumental),
          language: request.language || 'russian',
          isDraft: request.isDraft,
          parentTrackId: request.parentTrackId,
          variationType: request.variationType
        },
        credits_used: creditsNeeded
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Failed to create generation job:', jobError);
      throw new Error('Failed to create generation job');
    }

    console.log(`✅ Created enhanced generation job: ${jobData.id}`);

    // STEP 2: Process generation asynchronously with enhanced progress tracking
    EdgeRuntime.waitUntil(
      processEnhancedGeneration(jobData.id, request, supabaseAdmin)
        .catch(async (error) => {
          console.error(`❌ Enhanced generation failed for job ${jobData.id}:`, error);
          
          await updateJobProgress(
            supabaseAdmin, 
            jobData.id, 
            'failed', 
            0, 
            `Generation failed: ${error.message}`
          );
        })
    );
    
    // Return immediate success response
    return new Response(
      JSON.stringify({
        success: true,
        jobId: jobData.id,
        message: 'Enhanced generation started successfully',
        status: 'processing',
        estimatedTime: estimateGenerationTime(request.provider, request.duration || 60)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error in enhanced generate-music function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during enhanced music generation'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// ENHANCED GENERATION PROCESSING
// ============================================================================

/**
 * Process generation with detailed progress tracking and proper content separation
 */
async function processEnhancedGeneration(
  jobId: string,
  request: EnhancedGenerationRequest,
  supabaseAdmin: any
) {
  console.log(`🚀 Starting enhanced processing for job ${jobId}`);
  
  try {
    // STEP 2: Prompt enhancement (if not already done)
    console.log('📈 STEP 2: Enhancing prompt...');
    await updateJobProgress(
      supabaseAdmin, 
      jobId, 
      'processing', 
      GENERATION_STEPS.PROMPT_ENHANCE.progress,
      GENERATION_STEPS.PROMPT_ENHANCE.message
    );

    let finalPrompt = request.enhancedPrompt || request.prompt;
    let finalStyle = request.styleDescription || request.style || 'pop';
    
    // Enhanced prompt generation using AI (mock for now)
    if (!request.enhancedPrompt) {
      finalPrompt = await enhancePromptWithAI(request.prompt, request.style);
      console.log('✨ Enhanced prompt:', finalPrompt);
    }

    // STEP 3: Lyrics generation (if needed and not provided)
    let finalLyrics = request.generatedLyrics;
    
    if (!request.instrumental && !finalLyrics) {
      console.log('🎤 STEP 3: Generating lyrics...');
      await updateJobProgress(
        supabaseAdmin, 
        jobId, 
        'processing', 
        GENERATION_STEPS.LYRICS_GENERATE.progress,
        GENERATION_STEPS.LYRICS_GENERATE.message
      );
      
      finalLyrics = await generateLyricsFromDescription(
        request.prompt, // Use original description, not enhanced prompt
        request.style || 'pop',
        request.language || 'russian'
      );
      console.log('🎼 Generated lyrics preview:', finalLyrics?.slice(0, 100) + '...');
    }

    // STEP 4: Style enhancement
    console.log('🎨 STEP 4: Enhancing style...');
    await updateJobProgress(
      supabaseAdmin, 
      jobId, 
      'processing', 
      GENERATION_STEPS.STYLE_ENHANCE.progress,
      GENERATION_STEPS.STYLE_ENHANCE.message
    );

    if (!request.styleDescription) {
      finalStyle = await enhanceStyleWithAI(request.style || 'pop', request.prompt);
      console.log('🎵 Enhanced style:', finalStyle);
    }

    // STEP 5: Music generation with properly structured data
    console.log('🎼 STEP 5: Generating music...');
    await updateJobProgress(
      supabaseAdmin, 
      jobId, 
      'processing', 
      GENERATION_STEPS.MUSIC_GENERATE.progress,
      GENERATION_STEPS.MUSIC_GENERATE.message
    );

    // Build proper Suno API request with CORRECT parameters
    const sunoRequest = {
      // CRITICAL: Use enhanced prompt as description, NOT as lyrics
      prompt: finalPrompt,        // This is the DESCRIPTION/THEME
      style: finalStyle,          // Enhanced style description
      title: extractTitleFromPrompt(request.prompt),
      customMode: true,
      instrumental: Boolean(request.instrumental),
      model: request.model || getDefaultModel(request.provider),
      callBackUrl: `https://psqxgksushbaoisbbdir.supabase.co/functions/v1/suno-callback`
    };

    // Add lyrics ONLY if not instrumental and lyrics exist
    if (!request.instrumental && finalLyrics && finalLyrics.trim()) {
      sunoRequest.lyrics = finalLyrics;
    }

    console.log('🎯 Final Suno API request structure:');
    console.log('- prompt (description):', sunoRequest.prompt);
    console.log('- style:', sunoRequest.style);
    console.log('- instrumental:', sunoRequest.instrumental);
    console.log('- has lyrics:', !!sunoRequest.lyrics);
    console.log('- title:', sunoRequest.title);

    // Call provider API
    let result;
    if (request.provider === 'suno') {
      result = await callSunoAPI(sunoRequest, supabaseAdmin, jobId);
    } else if (request.provider === 'mureka') {
      result = await callMurekaAPI(sunoRequest, supabaseAdmin, jobId);
    } else {
      result = await callTestAPI(sunoRequest, supabaseAdmin, jobId);
    }

    // STEP 6: Audio processing and storage
    console.log('💾 STEP 6: Processing and saving audio...');
    await updateJobProgress(
      supabaseAdmin, 
      jobId, 
      'processing', 
      GENERATION_STEPS.AUDIO_PROCESS.progress,
      GENERATION_STEPS.AUDIO_PROCESS.message
    );

    // Enhanced track creation with draft/variation support
    const trackData = await createEnhancedTrack(
      supabaseAdmin,
      jobId,
      result,
      request,
      {
        enhancedPrompt: finalPrompt,
        styleDescription: finalStyle,
        generatedLyrics: finalLyrics
      }
    );

    // STEP 7: Finalization
    console.log('✅ STEP 7: Finalizing...');
    await updateJobProgress(
      supabaseAdmin, 
      jobId, 
      'completed', 
      GENERATION_STEPS.FINALIZE.progress,
      GENERATION_STEPS.FINALIZE.message
    );

    // Update job as completed with enhanced metadata
    await supabaseAdmin
      .from('generation_jobs')
      .update({
        status: 'completed',
        progress: 100,
        track_id: trackData.id,
        response_data: {
          ...result,
          enhancedContent: {
            enhancedPrompt: finalPrompt,
            styleDescription: finalStyle,
            generatedLyrics: finalLyrics
          }
        }
      })
      .eq('id', jobId);

    console.log(`🎉 Enhanced generation completed successfully for job ${jobId}`);

  } catch (error) {
    console.error(`❌ Error in enhanced processing for job ${jobId}:`, error);
    throw error;
  }
}

// ============================================================================
// AI ENHANCEMENT FUNCTIONS  
// ============================================================================

/**
 * Enhance user prompt with AI to create better music description
 */
async function enhancePromptWithAI(originalPrompt: string, style?: string): Promise<string> {
  console.log('🤖 Enhancing prompt with AI...');
  
  // TODO: Call OpenAI/Claude API for prompt enhancement
  // For now, return an enhanced version
  const enhanced = `${originalPrompt} - создать ${style || 'современную'} музыкальную композицию с профессиональным качеством звучания, эмоциональной глубиной и запоминающейся мелодией`;
  
  console.log('Original:', originalPrompt);
  console.log('Enhanced:', enhanced);
  
  return enhanced;
}

/**
 * Generate lyrics from description (NOT using description as lyrics!)
 */
async function generateLyricsFromDescription(
  description: string, 
  style: string, 
  language: string
): Promise<string> {
  console.log('🎤 Generating lyrics from description...');
  
  // TODO: Call Suno Lyrics API or other lyrics generation service
  // For now, create structured lyrics based on description theme
  
  const theme = description.toLowerCase();
  let lyrics = '';
  
  if (language === 'russian') {
    lyrics = `[Verse]
Сегодня я чувствую ${theme.includes('грустн') ? 'печаль' : 'радость'}
В сердце звучит мелодия
${description.slice(0, 50)}
Это наша история

[Chorus]
Музыка играет в душе
Каждый звук как откровение
${style} ритм ведет нас вперед
К новому пробуждению

[Verse 2]
Каждый день новая песня
В каждом дне новый смысл
${description.includes('любов') ? 'Любовь' : 'Мечты'} наполняют пространство
Это и есть наша жизнь

[Chorus]
Музыка играет в душе
Каждый звук как откровение
${style} ритм ведет нас вперед
К новому пробуждению`;
  } else {
    lyrics = `[Verse]
Today I feel the rhythm
In my heart a melody plays
${description.slice(0, 50)}
This is our story

[Chorus]
Music flows through my soul
Every sound like revelation
${style} beat leads us forward
To a new awakening`;
  }
  
  console.log('Generated lyrics preview:', lyrics.slice(0, 100) + '...');
  return lyrics;
}

/**
 * Enhance style description with AI
 */
async function enhanceStyleWithAI(style: string, prompt: string): Promise<string> {
  console.log('🎨 Enhancing style with AI...');
  
  // TODO: Call AI service for style enhancement
  const enhanced = `${style}, современное профессиональное звучание, высокое качество продакшн, эмоциональная глубина, ${prompt.includes('быстр') ? 'энергичный темп' : 'умеренный темп'}`;
  
  console.log('Enhanced style:', enhanced);
  return enhanced;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

async function updateJobProgress(
  supabaseAdmin: any, 
  jobId: string, 
  status: string, 
  progress: number, 
  message?: string
) {
  console.log(`📊 Job ${jobId}: ${status} (${progress}%) - ${message || ''}`);
  
  const { error } = await supabaseAdmin
    .from('generation_jobs')
    .update({
      status,
      progress,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobId);

  if (error) {
    console.error('❌ Failed to update job progress:', error);
  }
}

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
    case 'suno': return Math.ceil(duration / 30) * 5;
    case 'mureka': return Math.ceil(duration / 30) * 8;
    case 'test': return 0;
    default: return 5;
  }
}

function estimateGenerationTime(provider: string, duration: number): number {
  // Return estimated time in seconds
  switch (provider) {
    case 'suno': return Math.max(60, duration * 2);
    case 'mureka': return Math.max(90, duration * 2.5);
    case 'test': return 10;
    default: return 60;
  }
}

function extractTitleFromPrompt(prompt: string): string {
  // Extract a reasonable title from prompt
  const words = prompt.split(' ').slice(0, 5);
  return words.join(' ').slice(0, 80);
}

/**
 * Create enhanced track with draft/variation support
 */
async function createEnhancedTrack(
  supabaseAdmin: any,
  jobId: string,
  result: any,
  request: EnhancedGenerationRequest,
  enhancedContent: any
) {
  console.log('💾 Creating enhanced track record...');
  
  const { data: job } = await supabaseAdmin
    .from('generation_jobs')
    .select('user_id')
    .eq('id', jobId)
    .single();

  const trackData = {
    user_id: job.user_id,
    title: result.title || extractTitleFromPrompt(request.prompt),
    description: request.prompt, // Original user description
    duration: result.duration || request.duration || 60,
    file_url: result.audioUrl,
    artwork_url: result.imageUrl,
    genre: request.style,
    provider: request.provider,
    provider_track_id: result.id,
    generation_params: {
      originalPrompt: request.prompt,
      enhancedPrompt: enhancedContent.enhancedPrompt,
      styleDescription: enhancedContent.styleDescription,
      generatedLyrics: enhancedContent.generatedLyrics,
      // ... other params
    },
    lyrics: enhancedContent.generatedLyrics,
    is_public: false,
    is_draft: request.isDraft || false,
    parent_draft_id: request.parentTrackId || null
  };

  const { data: track, error } = await supabaseAdmin
    .from('tracks')
    .insert(trackData)
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create track:', error);
    throw new Error('Failed to create track');
  }

  // Create variation relationship if this is a variation
  if (request.parentTrackId && request.variationType) {
    await supabaseAdmin
      .from('track_variations')
      .insert({
        parent_track_id: request.parentTrackId,
        child_track_id: track.id,
        variation_type: request.variationType
      });
  }

  console.log('✅ Enhanced track created:', track.id);
  return track;
}

/**
 * Call Suno API with enhanced error handling
 */
async function callSunoAPI(request: any, supabaseAdmin: any, jobId: string) {
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  
  if (!sunoApiKey) {
    throw new Error('SUNO_API_KEY not configured');
  }

  console.log('🎵 Calling Suno API with enhanced request...');
  
  const response = await fetch('https://api.sunoapi.org/api/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sunoApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Suno API error:', errorText);
    throw new Error(`Suno API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ Suno API response received');
  
  // Extract task ID and start polling
  const taskId = extractTaskId(result);
  if (!taskId) {
    throw new Error('No task ID in Suno response');
  }
  
  // Poll for completion with enhanced progress updates
  return await pollSunoCompletion(taskId, supabaseAdmin, jobId);
}

async function callMurekaAPI(request: any, supabaseAdmin: any, jobId: string) {
  // TODO: Implement Mureka API call
  throw new Error('Mureka API not implemented yet');
}

async function callTestAPI(request: any, supabaseAdmin: any, jobId: string) {
  console.log('🧪 Using test API...');
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  return {
    id: 'test_' + Date.now(),
    title: request.title || 'Test Track',
    audioUrl: 'https://example.com/test-audio.mp3',
    imageUrl: 'https://example.com/test-image.jpg',
    duration: request.duration || 60
  };
}

function extractTaskId(response: any): string | null {
  if (response.data?.taskId) return response.data.taskId;
  if (response.data?.task_id) return response.data.task_id;
  if (response.data?.id) return response.data.id;
  if (Array.isArray(response.data) && response.data[0]?.taskId) return response.data[0].taskId;
  return null;
}

async function pollSunoCompletion(taskId: string, supabaseAdmin: any, jobId: string) {
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
    
    try {
      const response = await fetch(`https://api.sunoapi.org/api/v1/music/record-info?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${sunoApiKey}` }
      });
      
      if (!response.ok) continue;
      
      const result = await response.json();
      
      if (result.data?.musicData) {
        const music = result.data.musicData[0];
        if (music && music.audio_url) {
          console.log('✅ Suno generation completed');
          return {
            id: music.id,
            title: music.title,
            audioUrl: music.audio_url,
            imageUrl: music.image_url,
            duration: music.duration
          };
        }
      }
      
      // Update progress during polling
      const progressPercent = Math.min(70 + (attempts / maxAttempts) * 15, 85);
      await updateJobProgress(supabaseAdmin, jobId, 'processing', progressPercent, 'Ожидаем завершения генерации...');
      
    } catch (error) {
      console.warn(`Polling attempt ${attempts} failed:`, error);
    }
  }
  
  throw new Error('Suno generation timed out');
}
