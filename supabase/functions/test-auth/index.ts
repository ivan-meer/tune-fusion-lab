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
    console.log('Test auth function called');
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

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

    console.log('Getting user...');
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    console.log('User result:', { userId: user?.id, error: userError?.message });

    if (userError || !user) {
      console.error('Authorization failed:', userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unauthorized: ${userError?.message || 'No user found'}`,
          debug: {
            hasAuthHeader: !!req.headers.get('Authorization'),
            authHeaderPreview: req.headers.get('Authorization')?.slice(0, 20) + '...'
          }
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Authentication successful',
        user: {
          id: user.id,
          email: user.email
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in test-auth function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});