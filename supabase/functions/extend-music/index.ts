import { corsHeaders } from '../_shared/cors.ts'

const corsHandler = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
}

interface ExtendMusicRequest {
  audioId: string
  continueAt?: number
  prompt?: string
  model?: string
}

Deno.serve(async (req) => {
  const corsResponse = corsHandler(req)
  if (corsResponse) return corsResponse

  try {
    const { audioId, continueAt = 30, prompt = "Продолжить композицию", model = "V4_5" }: ExtendMusicRequest = await req.json()

    console.log('Extending music:', { audioId, continueAt, prompt, model })

    const sunoApiKey = Deno.env.get('SUNO_API_KEY')
    if (!sunoApiKey) {
      throw new Error('SUNO_API_KEY not found')
    }

    const sunoResponse = await fetch('https://api.sunoapi.org/api/v1/extend', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioId,
        defaultParamFlag: true,
        prompt,
        continueAt,
        model,
        callBackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/suno-callback`
      }),
    })

    if (!sunoResponse.ok) {
      const errorText = await sunoResponse.text()
      console.error('Suno API error:', errorText)
      throw new Error(`Suno API error: ${sunoResponse.status} ${errorText}`)
    }

    const result = await sunoResponse.json()
    console.log('Extension started:', result)

    return new Response(
      JSON.stringify({
        success: true,
        taskId: result.data?.taskId,
        message: 'Расширение трека начато'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error extending music:', error)
    
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