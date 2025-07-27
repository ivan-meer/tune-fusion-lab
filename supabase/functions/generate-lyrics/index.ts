import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface LyricsRequest {
  prompt: string;
  style?: string;
  language?: string;
  structure?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting lyrics generation...');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting lyrics generation for user:', user.id);

    // Parse request
    const lyricsRequest: LyricsRequest = await req.json();
    console.log('Lyrics request:', lyricsRequest);

    // Get Suno API key
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    console.log('SUNO_API_KEY available:', !!sunoApiKey);
    console.log('SUNO_API_KEY length:', sunoApiKey ? sunoApiKey.length : 0);
    
    if (!sunoApiKey) {
      console.error('SUNO_API_KEY is missing from environment variables');
      return new Response(
        JSON.stringify({ error: 'Suno API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate lyrics using Suno API - use /api/v1/generate with specific lyrics parameters
    const callbackUrl = `${supabaseUrl}/functions/v1/suno-callback`;
    
    // Создаем запрос ТОЛЬКО для лирики (без аудио)
    const requestBody = {
      prompt: lyricsRequest.prompt,
      style: lyricsRequest.style || 'pop',
      title: `Lyrics: ${lyricsRequest.prompt.substring(0, 50)}...`,
      customMode: true,
      instrumental: false,
      make_instrumental: false,
      wait_audio: false, // Не ждать генерацию аудио
      lyrics_only: true, // Только лирика
      callBackUrl: callbackUrl
    };

    console.log('Sending LYRICS-ONLY request to Suno API:', JSON.stringify({...requestBody, callBackUrl: '[REDACTED]'}, null, 2));

    const lyricsResponse = await fetch('https://api.sunoapi.org/api/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!lyricsResponse.ok) {
      const errorText = await lyricsResponse.text();
      console.error('Suno lyrics API error details:');
      console.error('Status:', lyricsResponse.status);
      console.error('Status Text:', lyricsResponse.statusText);
      console.error('Headers:', Object.fromEntries(lyricsResponse.headers.entries()));
      console.error('Response Body:', errorText);
      console.error('Request Body was:', JSON.stringify(requestBody, null, 2));
      
      return new Response(
        JSON.stringify({ 
          error: `Suno Lyrics API error: ${lyricsResponse.status} ${errorText}`,
          details: {
            status: lyricsResponse.status,
            statusText: lyricsResponse.statusText,
            requestBody: requestBody
          }
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lyricsData = await lyricsResponse.json();
    console.log('Suno lyrics response:', lyricsData);

    // Handle async response - Suno API returns taskId for async processing
    if (lyricsData.code === 200 && lyricsData.data?.taskId) {
      console.log('Lyrics generation started with taskId:', lyricsData.data.taskId);
      
      // Save initial record with pending status and lyrics-specific metadata
      const { data: savedLyrics, error: saveError } = await supabase
        .from('lyrics')
        .insert({
          user_id: user.id,
          title: `Lyrics: ${lyricsRequest.prompt.substring(0, 50)}...`,
          content: 'Генерация лирики в процессе... Ожидайте результат.',
          prompt: lyricsRequest.prompt,
          style: lyricsRequest.style || 'pop',
          language: lyricsRequest.language || 'russian',
          provider: 'suno',
          provider_lyrics_id: lyricsData.data.taskId,
          generation_params: {
            ...lyricsRequest,
            lyrics_only: true,
            wait_audio: false,
            endpoint_used: '/api/v1/generate'
          }
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving lyrics:', saveError);
        return new Response(
          JSON.stringify({ error: 'Failed to save lyrics', details: saveError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Lyrics generation task created successfully with taskId:', lyricsData.data.taskId);

      return new Response(
        JSON.stringify({
          success: true,
          status: 'pending',
          taskId: lyricsData.data.taskId,
          lyrics: savedLyrics,
          message: 'Генерация текста начата. Результат будет доступен через несколько минут.'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If we reach here, the API didn't return a taskId - handle error
    console.error('Unexpected Suno API response format:', lyricsData);
    return new Response(
      JSON.stringify({ 
        error: 'Unexpected API response format', 
        details: lyricsData 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-lyrics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});