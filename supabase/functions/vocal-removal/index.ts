import { corsHeaders } from '../_shared/cors.ts'

const corsHandler = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
}

interface VocalRemovalRequest {
  taskId: string
  audioId: string
}

Deno.serve(async (req) => {
  const corsResponse = corsHandler(req)
  if (corsResponse) return corsResponse

  try {
    const { taskId, audioId }: VocalRemovalRequest = await req.json()

    console.log('Removing vocals:', { taskId, audioId })

    const sunoApiKey = Deno.env.get('SUNO_API_KEY')
    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not found')
    }

    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/vocal-removal/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        audioId,
        callBackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/suno-callback`
      }),
    })

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text()
      console.error('Suno API error:', errorText)
      throw new Error(`Suno API error: ${sunoResponse.status} ${errorText}`)
    }

    const result = await sunoResponse.json()
    console.log('Vocal removal started:', result)

    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.data?.taskId,
        message: 'Разделение вокала начато'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error removing vocals:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})