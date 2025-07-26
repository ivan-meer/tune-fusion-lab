import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CallbackData {
  taskId: string;
  status: 'completed' | 'failed' | 'processing';
  result?: {
    audioUrl?: string;
    videoUrl?: string;
    lyrics?: string;
    duration?: number;
    title?: string;
    image_url?: string;
  };
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Suno callback received');
    
    const callbackData: CallbackData = await req.json();
    console.log('Callback data:', callbackData);

    const { taskId, status, result, error } = callbackData;

    if (!taskId) {
      console.error('No taskId in callback');
      return new Response(JSON.stringify({ error: 'taskId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the generation job by task ID
    const { data: jobs, error: fetchError } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('response_data->task_id', taskId)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching generation job:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!jobs || jobs.length === 0) {
      console.error('No generation job found for taskId:', taskId);
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const job = jobs[0];

    if (status === 'completed' && result) {
      console.log('Processing completed callback');
      
      // Create track record
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .insert({
          user_id: job.user_id,
          title: result.title || 'Generated Track',
          file_url: result.audioUrl,
          artwork_url: result.image_url,
          duration: result.duration || 0,
          provider: 'suno',
          provider_track_id: taskId,
          lyrics: result.lyrics,
          generation_params: job.request_params,
          is_public: false,
          is_commercial: false
        })
        .select()
        .single();

      if (trackError) {
        console.error('Error creating track:', trackError);
        
        // Update job as failed
        await supabase
          .from('generation_jobs')
          .update({
            status: 'failed',
            error_message: `Failed to save track: ${trackError.message}`,
            updated_at: new Date().toISOString(),
            progress: 0
          })
          .eq('id', job.id);

        return new Response(JSON.stringify({ error: 'Failed to save track' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update job as completed
      const { error: updateError } = await supabase
        .from('generation_jobs')
        .update({
          status: 'completed',
          progress: 100,
          track_id: track.id,
          response_data: {
            ...job.response_data,
            result: result
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateError) {
        console.error('Error updating job:', updateError);
      }

      console.log('Callback processed successfully for completed job');

    } else if (status === 'failed') {
      console.log('Processing failed callback');
      
      // Update job as failed
      const { error: updateError } = await supabase
        .from('generation_jobs')
        .update({
          status: 'failed',
          error_message: error || 'Generation failed',
          updated_at: new Date().toISOString(),
          progress: 0
        })
        .eq('id', job.id);

      if (updateError) {
        console.error('Error updating failed job:', updateError);
      }

      console.log('Callback processed successfully for failed job');

    } else if (status === 'processing') {
      console.log('Processing progress callback');
      
      // Update job progress
      const { error: updateError } = await supabase
        .from('generation_jobs')
        .update({
          status: 'processing',
          progress: 50, // Intermediate progress
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (updateError) {
        console.error('Error updating job progress:', updateError);
      }

      console.log('Progress callback processed successfully');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Callback processing error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});