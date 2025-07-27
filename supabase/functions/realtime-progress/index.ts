import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProgressUpdate {
  jobId: string;
  stage: string;
  progress: number;
  details?: string;
  tokensUsed?: number;
  estimatedTimeRemaining?: number;
  streamingChunk?: {
    data: string;
    index: number;
    format: string;
  };
}

// Global map to store WebSocket connections by job ID
const connections = new Map<string, WebSocket>();

Deno.serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const url = new URL(req.url);
  const jobId = url.searchParams.get('jobId');
  
  if (!jobId) {
    socket.close(1008, 'jobId parameter required');
    return response;
  }

  console.log(`🔗 WebSocket connected for job: ${jobId}`);
  
  // Store connection
  connections.set(jobId, socket);

  socket.onopen = () => {
    console.log(`✅ WebSocket opened for job ${jobId}`);
    socket.send(JSON.stringify({
      type: 'connection_established',
      jobId,
      timestamp: Date.now()
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log(`📨 Received message for job ${jobId}:`, message);

      // Handle client messages
      switch (message.type) {
        case 'request_status':
          await sendJobStatus(socket, jobId);
          break;
        case 'ping':
          socket.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
      }
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
    }
  };

  socket.onclose = () => {
    console.log(`🔌 WebSocket closed for job ${jobId}`);
    connections.delete(jobId);
  };

  socket.onerror = (error) => {
    console.error(`❌ WebSocket error for job ${jobId}:`, error);
    connections.delete(jobId);
  };

  return response;
});

async function sendJobStatus(socket: WebSocket, jobId: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: job, error } = await supabase
      .from('generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error fetching job status:', error);
      return;
    }

    socket.send(JSON.stringify({
      type: 'status_update',
      jobId,
      status: job.status,
      progress: job.progress,
      error: job.error_message,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('Error sending job status:', error);
  }
}

// Export function to send progress updates from other edge functions
export async function sendProgressUpdate(update: ProgressUpdate) {
  const socket = connections.get(update.jobId);
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log(`⚠️ No active WebSocket for job ${update.jobId}`);
    return;
  }

  try {
    socket.send(JSON.stringify({
      type: 'progress_update',
      ...update,
      timestamp: Date.now()
    }));
    console.log(`📡 Sent progress update for job ${update.jobId}: ${update.stage} - ${update.progress}%`);
  } catch (error) {
    console.error('❌ Error sending progress update:', error);
  }
}

// Export function to send streaming audio chunks
export async function sendAudioChunk(jobId: string, chunk: { data: string; index: number; format: string; duration?: number }) {
  const socket = connections.get(jobId);
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return;
  }

  try {
    socket.send(JSON.stringify({
      type: 'audio_chunk',
      jobId,
      chunk,
      timestamp: Date.now()
    }));
    console.log(`🎵 Sent audio chunk ${chunk.index} for job ${jobId}`);
  } catch (error) {
    console.error('❌ Error sending audio chunk:', error);
  }
}