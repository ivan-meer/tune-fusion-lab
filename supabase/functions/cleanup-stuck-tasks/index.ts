import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    console.log('Starting cleanup of stuck generation tasks...');

    // Define timeout thresholds
    const PROCESSING_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    const PENDING_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    // Get current timestamp
    const now = new Date();
    const processingTimeoutDate = new Date(now.getTime() - PROCESSING_TIMEOUT);
    const pendingTimeoutDate = new Date(now.getTime() - PENDING_TIMEOUT);

    // Find stuck processing jobs (older than 15 minutes)
    const { data: stuckProcessingJobs, error: processingError } = await supabase
      .from('generation_jobs')
      .select('id, created_at, updated_at, status, user_id')
      .eq('status', 'processing')
      .lt('updated_at', processingTimeoutDate.toISOString());

    if (processingError) {
      console.error('Error fetching stuck processing jobs:', processingError);
    }

    // Find stuck pending jobs (older than 30 minutes)
    const { data: stuckPendingJobs, error: pendingError } = await supabase
      .from('generation_jobs')
      .select('id, created_at, updated_at, status, user_id')
      .eq('status', 'pending')
      .lt('created_at', pendingTimeoutDate.toISOString());

    if (pendingError) {
      console.error('Error fetching stuck pending jobs:', pendingError);
    }

    const allStuckJobs = [...(stuckProcessingJobs || []), ...(stuckPendingJobs || [])];
    
    if (allStuckJobs.length === 0) {
      console.log('No stuck jobs found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No stuck jobs found',
        cleanedJobs: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Found ${allStuckJobs.length} stuck jobs to clean up`);

    // Update stuck jobs to failed status
    const jobIds = allStuckJobs.map(job => job.id);
    
    const { error: updateError } = await supabase
      .from('generation_jobs')
      .update({
        status: 'failed',
        error_message: 'Task timed out and was automatically cleaned up',
        updated_at: new Date().toISOString(),
        progress: 0
      })
      .in('id', jobIds);

    if (updateError) {
      console.error('Error updating stuck jobs:', updateError);
      throw new Error(`Failed to update stuck jobs: ${updateError.message}`);
    }

    console.log(`Successfully cleaned up ${allStuckJobs.length} stuck jobs`);

    // Log cleanup activity
    const cleanupSummary = {
      cleanedAt: new Date().toISOString(),
      totalCleaned: allStuckJobs.length,
      processingJobs: stuckProcessingJobs?.length || 0,
      pendingJobs: stuckPendingJobs?.length || 0,
      jobIds: jobIds
    };

    console.log('Cleanup summary:', cleanupSummary);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Successfully cleaned up stuck jobs',
      ...cleanupSummary
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});