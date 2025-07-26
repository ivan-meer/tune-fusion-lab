import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerationRequest {
  prompt: string;
  provider: 'suno' | 'mureka';
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
    console.log('Starting mock music generation...');
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }

    const { prompt, provider, style, duration, instrumental, lyrics } = await req.json();
    
    console.log('Request params:', { prompt, provider, style, duration, instrumental });

    // Create a mock successful response
    const mockJobId = crypto.randomUUID();
    const mockTrack = {
      id: crypto.randomUUID(),
      title: prompt.slice(0, 50) || 'Generated Track',
      file_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav', // Demo audio
      artwork_url: 'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=AI+Music',
      duration: duration || 120,
      created_at: new Date().toISOString()
    };

    console.log('Mock track created:', mockTrack.title);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return new Response(
      JSON.stringify({
        success: true,
        jobId: mockJobId,
        trackId: mockTrack.id,
        track: mockTrack,
        result: {
          id: mockTrack.id,
          title: mockTrack.title,
          audioUrl: mockTrack.file_url,
          imageUrl: mockTrack.artwork_url,
          duration: mockTrack.duration,
          lyrics: lyrics || 'Mock generated lyrics...'
        }
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