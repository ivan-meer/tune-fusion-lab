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
    if (!sunoApiKey) {
      return new Response(
        JSON.stringify({ error: 'Suno API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate lyrics using Suno API with proper parameters
    const requestBody = {
      prompt: lyricsRequest.prompt,
      customMode: true,
      title: `Generated Lyrics for ${lyricsRequest.style || 'pop'}`,
      style: lyricsRequest.style || 'pop',
      instrumental: false, // Required parameter - we want lyrics, not instrumental
      language: lyricsRequest.language || 'russian'
    };

    console.log('Sending request to Suno API:', requestBody);

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
      console.error('Suno lyrics API error:', lyricsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Suno Lyrics API error: ${lyricsResponse.status} ${errorText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lyricsData = await lyricsResponse.json();
    console.log('Suno lyrics response:', lyricsData);

    // Extract lyrics from response with improved handling
    let generatedLyrics = '';
    
    if (lyricsData.code === 200 && lyricsData.data) {
      // Success response - extract lyrics from various possible fields
      if (typeof lyricsData.data === 'string') {
        generatedLyrics = lyricsData.data;
      } else if (lyricsData.data.text) {
        generatedLyrics = lyricsData.data.text;
      } else if (lyricsData.data.lyrics) {
        generatedLyrics = lyricsData.data.lyrics;
      } else if (lyricsData.data.content) {
        generatedLyrics = lyricsData.data.content;
      } else if (Array.isArray(lyricsData.data) && lyricsData.data.length > 0) {
        // If data is an array, take the first item's text
        const firstItem = lyricsData.data[0];
        generatedLyrics = firstItem.text || firstItem.lyrics || firstItem.content || '';
      }
    } else if (lyricsData.lyrics) {
      // Direct lyrics field
      generatedLyrics = lyricsData.lyrics;
    } else if (lyricsData.text) {
      // Direct text field
      generatedLyrics = lyricsData.text;
    }
    
    // Fallback if no lyrics extracted
    if (!generatedLyrics) {
      console.error('Failed to extract lyrics from response:', lyricsData);
      generatedLyrics = `Generated lyrics not available. API Response: ${JSON.stringify(lyricsData)}`;
    }
    
    console.log('Extracted lyrics:', generatedLyrics.substring(0, 200) + '...');

    // Save to database
    const { data: savedLyrics, error: saveError } = await supabase
      .from('lyrics')
      .insert({
        user_id: user.id,
        title: `Lyrics for: ${lyricsRequest.prompt.substring(0, 50)}...`,
        content: generatedLyrics,
        prompt: lyricsRequest.prompt,
        style: lyricsRequest.style || 'pop',
        language: lyricsRequest.language || 'russian',
        provider: 'suno',
        provider_lyrics_id: lyricsData.data?.id || null,
        generation_params: lyricsRequest
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

    console.log('Lyrics generated and saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        lyrics: savedLyrics,
        sunoData: lyricsData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-lyrics function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});