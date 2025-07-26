import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
    // Use hardcoded values for consistency
    const supabaseUrl = 'https://psqxgksushbaoisbbdir.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcXhna3N1c2hiYW9pc2JiZGlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4ODQzNTEsImV4cCI6MjA2MzQ2MDM1MX0.lhdQtxSv5syaYA59u7XFY3Ar5BesVJkC2tVWlO7CmwE';
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user from JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Authorization failed in get-generation-status:', userError);
      throw new Error('Unauthorized');
    }

    const { jobId } = await req.json();

    if (!jobId) {
      throw new Error('Job ID is required');
    }

    // Get generation job status
    const { data: jobData, error: jobError } = await supabaseClient
      .from('generation_jobs')
      .select(`
        *,
        tracks (
          id,
          title,
          file_url,
          artwork_url,
          duration,
          created_at
        )
      `)
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError) {
      throw new Error(`Failed to get generation job: ${jobError.message}`);
    }

    if (!jobData) {
      throw new Error('Generation job not found');
    }

    return new Response(
      JSON.stringify({
        success: true,
        job: jobData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in get-generation-status function:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});