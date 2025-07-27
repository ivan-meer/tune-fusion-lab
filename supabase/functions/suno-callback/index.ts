import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CallbackData {
  code: number;
  msg: string;
  data: {
    callbackType: 'complete' | 'error' | 'processing';
    task_id?: string;
    taskId?: string;
    // For music generation
    data?: Array<{
      id: string;
      audio_url: string;
      source_audio_url: string;
      stream_audio_url: string;
      source_stream_audio_url: string;
      image_url: string;
      source_image_url: string;
      prompt: string;
      model_name: string;
      title: string;
      tags: string;
      createTime: string;
      duration: number;
    }> | null;
    // For lyrics generation
    lyricsData?: Array<{
      text: string;
      title: string;
      status: string;
      errorMessage?: string;
    }> | null;
  };
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

    const { code, msg, data } = callbackData;
    const taskId = data.task_id || data.taskId;
    const status = data.callbackType;
    const result = data.data?.[0];
    const lyricsResult = data.lyricsData?.[0];
    const error = code !== 200 ? msg : undefined;

    if (!taskId) {
      console.error('No taskId in callback');
      return new Response(JSON.stringify({ error: 'taskId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Find the generation job by task ID - try multiple approaches
    console.log('Searching for job with taskId:', taskId);
    
    let jobs = null;
    let fetchError = null;
    
    // First try: search in response_data->taskId path
    ({ data: jobs, error: fetchError } = await supabase
      .from('generation_jobs')
      .select('*')
      .filter('response_data->taskId', 'eq', taskId)
      .limit(1));
    
    // Second try: search by converting response_data to text and using LIKE
    if (!jobs || jobs.length === 0) {
      console.log('Trying alternative search by response_data text...');
      ({ data: jobs, error: fetchError } = await supabase
        .from('generation_jobs')
        .select('*')
        .textSearch('response_data', taskId)
        .limit(1));
    }
    
    // Third try: search all recent jobs and filter in code
    if (!jobs || jobs.length === 0) {
      console.log('Trying full search approach...');
      ({ data: jobs, error: fetchError } = await supabase
        .from('generation_jobs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false }));
        
      if (jobs) {
        jobs = jobs.filter(job => {
          const responseData = job.response_data;
          if (responseData && typeof responseData === 'object') {
            return responseData.taskId === taskId || 
                   responseData.task_id === taskId ||
                   JSON.stringify(responseData).includes(taskId);
          }
          return false;
        });
        jobs = jobs.slice(0, 1); // Take only the first match
      }
    }

    if (fetchError) {
      console.error('Error fetching generation job:', fetchError);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If no generation job found, try to find lyrics record
    let lyricsRecord = null;
    if (!jobs || jobs.length === 0) {
      console.log('Searching for lyrics record with taskId:', taskId);
      
      // Try different approaches to find the lyrics record
      let { data: lyricsData, error: lyricsError } = await supabase
        .from('lyrics')
        .select('*')
        .eq('provider_lyrics_id', taskId);
      
      console.log('Lyrics search result:', { lyricsData, lyricsError, taskId });
      
      if (lyricsData && lyricsData.length > 0) {
        lyricsRecord = lyricsData[0];
        console.log('Found lyrics record:', lyricsRecord.id);
      } else {
        console.log('No lyrics record found, trying case-insensitive search...');
        // Try case-insensitive search
        ({ data: lyricsData, error: lyricsError } = await supabase
          .from('lyrics')
          .select('*')
          .ilike('provider_lyrics_id', taskId));
        
        if (lyricsData && lyricsData.length > 0) {
          lyricsRecord = lyricsData[0];
          console.log('Found lyrics record with case-insensitive search:', lyricsRecord.id);
        }
      }
    }

    if ((!jobs || jobs.length === 0) && !lyricsRecord) {
      console.error('No generation job or lyrics record found for taskId:', taskId);
      return new Response(JSON.stringify({ error: 'Record not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Handle lyrics callback
    if (lyricsRecord) {
      console.log('Processing lyrics callback for record:', lyricsRecord.id);
      console.log('Callback status:', status, 'Data structure:', JSON.stringify(data, null, 2));
      
      if (status === 'complete' && data.data && data.data.length > 0) {
        console.log('Processing complete lyrics callback');
        
        // For lyrics generation, the actual lyrics text should be in the first data item
        // Sometimes Suno returns the lyrics in different fields, let's check all possibilities
        const firstItem = data.data[0];
        let lyricsContent = '';
        
        // Try to extract lyrics from various possible fields
        if (firstItem.lyrics) {
          lyricsContent = firstItem.lyrics;
        } else if (firstItem.text) {
          lyricsContent = firstItem.text;
        } else if (firstItem.content) {
          lyricsContent = firstItem.content;
        } else if (firstItem.generated_text) {
          lyricsContent = firstItem.generated_text;
        } else {
          // If no specific lyrics field, this might be a music generation instead of lyrics
          // Check if this is actually a music track by looking for audio_url
          if (firstItem.audio_url) {
            console.log('Detected music generation instead of lyrics, skipping lyrics update');
            return new Response(JSON.stringify({ success: true, message: 'Music generation, not lyrics' }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          // Fallback: use a message indicating completion
          lyricsContent = 'Лирика сгенерирована успешно, но текст не получен в ожидаемом формате.';
        }
        
        console.log('Extracted lyrics content length:', lyricsContent.length);
        console.log('First 200 chars:', lyricsContent.substring(0, 200));
        
        const { error: updateError } = await supabase
          .from('lyrics')
          .update({
            content: lyricsContent,
            title: firstItem.title || lyricsRecord.title,
            updated_at: new Date().toISOString()
          })
          .eq('id', lyricsRecord.id);
        
        if (updateError) {
          console.error('Error updating lyrics:', updateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update lyrics' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        console.log('Lyrics updated successfully:', lyricsRecord.id);
      } else if (status === 'error') {
        console.log('Lyrics generation failed, updating with error');
        const { error: updateError } = await supabase
          .from('lyrics')
          .update({
            content: 'Ошибка генерации лирики. Попробуйте снова.',
            updated_at: new Date().toISOString()
          })
          .eq('id', lyricsRecord.id);
        
        if (updateError) {
          console.error('Error updating lyrics with error:', updateError);
        }
      } else if (status === 'text' && data.data) {
        console.log('Text generation callback - processing lyrics');
        const firstItem = data.data[0];
        let lyricsContent = firstItem.text || firstItem.content || firstItem.lyrics || 'Лирика сгенерирована';
        
        console.log('Text callback - lyrics content:', lyricsContent.substring(0, 200));
        
        const { error: updateError } = await supabase
          .from('lyrics')
          .update({
            content: lyricsContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', lyricsRecord.id);
        
        if (updateError) {
          console.error('Error updating lyrics from text callback:', updateError);
        } else {
          console.log('Lyrics updated from text callback successfully');
        }
      } else {
        console.log('Lyrics callback received, status:', status, 'waiting for completion or different data structure');
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
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

    if (status === 'complete' && result) {
      console.log('Processing completed callback');
      
      // Save file to Supabase Storage if needed
      let finalFileUrl = result.audio_url;
      let finalArtworkUrl = result.image_url;
      
      try {
        // Download and save to our storage bucket
        if (result.audio_url && result.audio_url.startsWith('http')) {
          const audioResponse = await fetch(result.audio_url);
          if (audioResponse.ok) {
            const audioBlob = await audioResponse.arrayBuffer();
            const fileName = `${result.id || Date.now()}.mp3`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('audio-tracks')
              .upload(fileName, audioBlob, {
                contentType: 'audio/mpeg',
                duplex: 'replace'
              });
            
            if (!uploadError && uploadData) {
              const { data: { publicUrl } } = supabase.storage
                .from('audio-tracks')
                .getPublicUrl(fileName);
              finalFileUrl = publicUrl;
              console.log('Saved audio to storage:', finalFileUrl);
            }
          }
        }
      } catch (storageError) {
        console.warn('Failed to save to storage, using original URL:', storageError);
      }
      
      // Create track record
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .insert({
          user_id: job.user_id,
          title: result.title || job.request_params?.prompt?.slice(0, 50) || 'Generated Track',
          description: job.request_params?.prompt || '',
          file_url: finalFileUrl,
          artwork_url: finalArtworkUrl,
          duration: result.duration || 120,
          provider: 'suno',
          provider_track_id: result.id,
          lyrics: job.request_params?.lyrics || result.prompt,
          genre: job.request_params?.style || result.tags || 'pop',
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

    } else if (status === 'error') {
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