import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface StyleEnhanceRequest {
  content: string;
  provider?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting style enhancement...');

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

    // Parse request
    const enhanceRequest: StyleEnhanceRequest = await req.json();
    console.log('Style enhance request:', enhanceRequest);

    // Get Suno API key
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    if (!sunoApiKey) {
      return new Response(
        JSON.stringify({ error: 'Suno API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhance style using Suno API
    const enhanceResponse = await fetch('https://api.sunoapi.org/api/v1/style/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: enhanceRequest.content
      })
    });

    if (!enhanceResponse.ok) {
      const errorText = await enhanceResponse.text();
      console.error('Suno style API error:', enhanceResponse.status, errorText);
      
      // Fallback to local enhancement if API fails
      const localEnhancement = enhanceStyleLocally(enhanceRequest.content);
      
      return new Response(
        JSON.stringify({
          success: true,
          enhancedStyle: localEnhancement,
          method: 'local_fallback'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const enhanceData = await enhanceResponse.json();
    console.log('Suno style response:', enhanceData);

    // Extract enhanced style from response
    let enhancedStyle = '';
    if (enhanceData.data && enhanceData.data.result) {
      enhancedStyle = enhanceData.data.result;
    } else if (enhanceData.result) {
      enhancedStyle = enhanceData.result;
    } else {
      // Fallback to local enhancement
      enhancedStyle = enhanceStyleLocally(enhanceRequest.content);
    }

    return new Response(
      JSON.stringify({
        success: true,
        enhancedStyle: enhancedStyle,
        originalContent: enhanceRequest.content,
        method: 'suno_api',
        sunoData: enhanceData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in style-enhance function:', error);
    
    // Fallback to local enhancement on any error
    try {
      const body = await req.json();
      const localEnhancement = enhanceStyleLocally(body.content);
      
      return new Response(
        JSON.stringify({
          success: true,
          enhancedStyle: localEnhancement,
          method: 'local_fallback_error'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }
});

/**
 * Local style enhancement fallback
 * Adds professional music production terms to improve prompt quality
 */
function enhanceStyleLocally(content: string): string {
  const enhancements = [
    'с профессиональным студийным качеством',
    'с богатой аранжировкой и многослойным звучанием',
    'с эмоциональной подачей и динамичными переходами',
    'с современным продакшеном и пространственными эффектами',
    'с запоминающимся мелодическим крюком',
    'с глубоким басом и четкой ритм-секцией',
    'с атмосферными подложками и реверберацией',
    'с кинематографичным звучанием'
  ];
  
  // Select random enhancements
  const selectedEnhancements = enhancements
    .sort(() => 0.5 - Math.random())
    .slice(0, 2)
    .join(', ');
  
  return `${content}, ${selectedEnhancements}`;
}