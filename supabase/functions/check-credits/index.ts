import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking Suno API credits...');

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

    // Get Suno API key
    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    if (!sunoApiKey) {
      return new Response(
        JSON.stringify({ error: 'Suno API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check credits using Suno API
    const creditsResponse = await fetch('https://api.sunoapi.org/api/v1/generate/credit', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!creditsResponse.ok) {
      const errorText = await creditsResponse.text();
      console.error('Suno credits API error:', creditsResponse.status, errorText);
      
      // Fallback: return estimated credits based on usage
      const { data: recentJobs } = await supabase
        .from('generation_jobs')
        .select('credits_used')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const usedCreditsToday = recentJobs?.reduce((sum, job) => sum + (job.credits_used || 0), 0) || 0;
      const estimatedRemaining = Math.max(0, 100 - usedCreditsToday); // Assume 100 daily limit
      
      return new Response(
        JSON.stringify({
          success: true,
          credits: estimatedRemaining,
          method: 'estimated',
          warning: 'Could not fetch exact credits from Suno API'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creditsData = await creditsResponse.json();
    console.log('Suno credits response:', creditsData);

    // Extract credits from response
    let remainingCredits = 0;
    if (creditsData.data && typeof creditsData.data === 'number') {
      remainingCredits = creditsData.data;
    } else if (creditsData.credits && typeof creditsData.credits === 'number') {
      remainingCredits = creditsData.credits;
    } else if (creditsData.remaining && typeof creditsData.remaining === 'number') {
      remainingCredits = creditsData.remaining;
    }

    return new Response(
      JSON.stringify({
        success: true,
        credits: remainingCredits,
        method: 'suno_api',
        raw: creditsData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-credits function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});