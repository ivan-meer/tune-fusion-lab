import { corsHeaders } from '../_shared/cors.ts'

const corsHandler = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
}

interface WavConversionRequest {
  taskId: string
  audioId: string
}

Deno.serve(async (req) => {
  const corsResponse = corsHandler(req)
  if (corsResponse) return corsResponse

  try {
    const { taskId, audioId }: WavConversionRequest = await req.json()

    console.log('Converting to WAV:', { taskId, audioId })

    const sunoApiKey = Deno.env.get('SUNO_API_KEY')
    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not found')
    }

    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/wav-format/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        audioId
      }),
    })

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text()
      console.error('Suno API error:', errorText)
      throw new Error(`Suno API error: ${sunoResponse.status} ${errorText}`)
    }

    const result = await sunoResponse.json()
    console.log('WAV conversion started:', result)

    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.data?.taskId,
        message: 'Конвертация в WAV начата'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error converting to WAV:', error)
    
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