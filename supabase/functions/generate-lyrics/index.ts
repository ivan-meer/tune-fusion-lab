import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LyricsRequest {
  prompt: string;
  style?: string;
  language?: string;
  structure?: string; // verse, chorus, bridge format
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting lyrics generation...');
    
    const supabaseUrl = 'https://psqxgksushbaoisbbdir.supabase.co';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseServiceKey) {
      throw new Error('Server configuration error');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { prompt, style = 'pop', language = 'russian', structure } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Generate lyrics using Suno API
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not configured');
    }

    console.log('Generating lyrics with Suno AI...');

    const response = await fetch('https://api.sunoapi.org/api/v1/lyrics/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: `${prompt}. Style: ${style}. Language: ${language}. ${structure ? `Structure: ${structure}` : ''}`,
        style,
        language,
        callBackUrl: 'https://psqxgksushbaoisbbdir.supabase.co/functions/v1/lyrics-callback'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Suno Lyrics API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    if (data.code !== 200) {
      throw new Error(`Suno Lyrics API error: ${data.msg || 'Unknown error'}`);
    }

    // Save lyrics to database
    const { data: lyricsData, error: lyricsError } = await supabaseAdmin
      .from('lyrics')
      .insert({
        user_id: user.id,
        title: prompt.slice(0, 50),
        content: data.data.lyrics,
        prompt,
        style,
        language,
        provider: 'suno',
        provider_lyrics_id: data.data.taskId,
        generation_params: {
          prompt,
          style,
          language,
          structure
        }
      })
      .select()
      .single();

    if (lyricsError) {
      console.error('Failed to save lyrics:', lyricsError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        lyrics: {
          id: lyricsData?.id,
          content: data.data.lyrics,
          title: prompt.slice(0, 50),
          style,
          language
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in generate-lyrics function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during lyrics generation'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});