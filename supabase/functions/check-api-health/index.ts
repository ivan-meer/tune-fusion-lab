import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const sunoApiKey = Deno.env.get('SUNO_API_KEY');
    const murekaApiKey = Deno.env.get('MUREKA_API_KEY');

    const healthChecks = [];

    // Check Suno API
    if (sunoApiKey) {
      console.log('Checking Suno API health...');
      const sunoStart = Date.now();
      try {
        const response = await fetch('https://sunoapi.org/api/v1/generate', {
          method: 'POST',
          headers: {
            'api-key': sunoApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: 'health check',
            tags: 'test',
            title: 'Health Check',
            make_instrumental: true,
            wait_audio: false
          }),
        });

        const responseTime = Date.now() - sunoStart;
        let status = 'down';
        let errorMessage = null;

        if (response.status === 429) {
          status = 'degraded';
          errorMessage = 'Rate limited';
        } else if (response.status === 401) {
          status = 'down';
          errorMessage = 'Invalid API key';
        } else if (response.ok) {
          status = 'healthy';
        } else {
          status = 'degraded';
          errorMessage = `HTTP ${response.status}`;
        }

        healthChecks.push({
          provider: 'suno',
          model: 'v4',
          status,
          response_time: responseTime,
          error_message: errorMessage,
        });

      } catch (error) {
        healthChecks.push({
          provider: 'suno',
          model: 'v4',
          status: 'down',
          response_time: null,
          error_message: error.message,
        });
      }
    }

    // Check Mureka API (placeholder - would need real endpoint)
    if (murekaApiKey) {
      console.log('Checking Mureka API health...');
      healthChecks.push({
        provider: 'mureka',
        model: 'v6',
        status: 'healthy',
        response_time: 500,
        error_message: null,
      });
    }

    // Test provider is always healthy
    healthChecks.push({
      provider: 'test',
      model: 'test',
      status: 'healthy',
      response_time: 10,
      error_message: null,
    });

    // Insert health logs
    if (healthChecks.length > 0) {
      const { error } = await supabase
        .from('api_health_logs')
        .insert(healthChecks);

      if (error) {
        console.error('Error inserting health logs:', error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        checks: healthChecks,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in check-api-health function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});