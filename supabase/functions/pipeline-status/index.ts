import { corsHeaders } from '../_shared/cors.ts'

const corsHandler = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
}

Deno.serve(async (req) => {
  const corsResponse = corsHandler(req)
  if (corsResponse) return corsResponse

  try {
    const url = new URL(req.url)
    const pipelineId = url.searchParams.get('pipelineId')

    if (!pipelineId) {
      throw new Error('Pipeline ID is required')
    }

    console.log('Getting pipeline status:', pipelineId)

    // В реальной реализации это должно храниться в базе данных
    // Для демонстрации возвращаем примерное состояние
    const mockStatus = {
      pipelineId,
      status: 'processing',
      currentStep: 1,
      steps: [
        { name: 'Генерация базового трека', status: 'completed', progress: 100 },
        { name: 'Улучшение стиля', status: 'processing', progress: 60 },
        { name: 'Расширение трека', status: 'pending', progress: 0 },
        { name: 'Разделение вокала', status: 'pending', progress: 0 },
        { name: 'Конвертация в WAV', status: 'pending', progress: 0 }
      ],
      totalProgress: 32,
      estimatedTimeRemaining: 180
    }

    return new Response(
      JSON.stringify({
        success: true,
        pipeline: mockStatus
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error getting pipeline status:', error)
    
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