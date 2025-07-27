import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1'

const corsHandler = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
}

interface PipelineRequest {
  prompt: string
  style?: string
  title?: string
  enableExtension?: boolean
  enableVocalSeparation?: boolean
  enableWavConversion?: boolean
  extendAt?: number
  extendPrompt?: string
  model?: string
}

interface PipelineStep {
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  taskId?: string
  result?: any
  error?: string
}

interface PipelineJob {
  id: string
  userId: string
  steps: PipelineStep[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  currentStep: number
  finalResult?: any
  createdAt: string
}

Deno.serve(async (req) => {
  const corsResponse = corsHandler(req)
  if (corsResponse) return corsResponse

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Проверяем аутентификацию
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    const {
      prompt,
      style = "pop",
      title,
      enableExtension = true,
      enableVocalSeparation = false,
      enableWavConversion = false,
      extendAt = 30,
      extendPrompt = "Продолжить с финальным припевом",
      model = "V4_5"
    }: PipelineRequest = await req.json()

    console.log('Starting music pipeline:', {
      prompt, style, title, enableExtension, enableVocalSeparation, enableWavConversion
    })

    // Создаем этапы пайплайна
    const steps: PipelineStep[] = [
      { name: 'Генерация базового трека', status: 'pending' },
      { name: 'Улучшение стиля', status: 'pending' }
    ]

    if (enableExtension) {
      steps.push({ name: 'Расширение трека', status: 'pending' })
    }

    if (enableVocalSeparation) {
      steps.push({ name: 'Разделение вокала', status: 'pending' })
    }

    if (enableWavConversion) {
      steps.push({ name: 'Конвертация в WAV', status: 'pending' })
    }

    const pipelineId = crypto.randomUUID()
    
    const pipelineJob: PipelineJob = {
      id: pipelineId,
      userId: user.id,
      steps,
      status: 'processing',
      currentStep: 0,
      createdAt: new Date().toISOString()
    }

    // Запускаем фоновую задачу для выполнения пайплайна
    const processPipeline = async () => {
      const sunoApiKey = Deno.env.get('SUNO_API_KEY')
      if (!sunoApiKey) {
        throw new Error('SUNO_API_KEY not found')
      }

      try {
        // Этап 1: Улучшение стиля
        console.log('Step 1: Style enhancement')
        pipelineJob.steps[1].status = 'processing'
        
        const styleResponse = await fetch(`${supabaseUrl}/functions/v1/style-enhance`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: `${style}, ${prompt}` }),
        })

        const styleResult = await styleResponse.json()
        const enhancedStyle = styleResult.enhancedStyle || style
        pipelineJob.steps[1].status = 'completed'
        pipelineJob.steps[1].result = { enhancedStyle }

        // Этап 2: Генерация базового трека
        console.log('Step 2: Base track generation')
        pipelineJob.steps[0].status = 'processing'

        const musicResponse = await fetch(`${supabaseUrl}/functions/v1/generate-music`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            style: enhancedStyle,
            title: title || prompt.slice(0, 50),
            model,
            customMode: true,
            instrumental: false
          }),
        })

        const musicResult = await musicResponse.json()
        pipelineJob.steps[0].status = 'completed'
        pipelineJob.steps[0].taskId = musicResult.jobId
        
        // Ждем завершения генерации основного трека
        let completed = false
        let attempts = 0
        const maxAttempts = 120 // 10 минут

        while (!completed && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000))
          
          const { data: job } = await supabase
            .from('generation_jobs')
            .select('*')
            .eq('id', musicResult.jobId)
            .single()

          if (job?.status === 'completed') {
            completed = true
            pipelineJob.steps[0].result = job
            
            // Получаем данные трека
            const { data: track } = await supabase
              .from('tracks')
              .select('*')
              .eq('id', job.track_id)
              .single()

            if (track && enableExtension) {
              // Этап 3: Расширение трека
              console.log('Step 3: Track extension')
              const extendStepIndex = steps.findIndex(s => s.name === 'Расширение трека')
              pipelineJob.steps[extendStepIndex].status = 'processing'

              const extendResponse = await fetch(`${supabaseUrl}/functions/v1/extend-music`, {
                method: 'POST',
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  audioId: track.provider_track_id,
                  continueAt: Math.max(track.duration - extendAt, 30),
                  prompt: extendPrompt,
                  model
                }),
              })

              const extendResult = await extendResponse.json()
              pipelineJob.steps[extendStepIndex].status = 'completed'
              pipelineJob.steps[extendStepIndex].taskId = extendResult.taskId
            }

            if (track && enableVocalSeparation) {
              // Этап 4: Разделение вокала
              console.log('Step 4: Vocal separation')
              const vocalStepIndex = steps.findIndex(s => s.name === 'Разделение вокала')
              pipelineJob.steps[vocalStepIndex].status = 'processing'

              const vocalResponse = await fetch(`${supabaseUrl}/functions/v1/vocal-removal`, {
                method: 'POST',
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  taskId: musicResult.jobId,
                  audioId: track.provider_track_id
                }),
              })

              const vocalResult = await vocalResponse.json()
              pipelineJob.steps[vocalStepIndex].status = 'completed'
              pipelineJob.steps[vocalStepIndex].taskId = vocalResult.taskId
            }

            if (track && enableWavConversion) {
              // Этап 5: Конвертация в WAV
              console.log('Step 5: WAV conversion')
              const wavStepIndex = steps.findIndex(s => s.name === 'Конвертация в WAV')
              pipelineJob.steps[wavStepIndex].status = 'processing'

              const wavResponse = await fetch(`${supabaseUrl}/functions/v1/wav-conversion`, {
                method: 'POST',
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  taskId: musicResult.jobId,
                  audioId: track.provider_track_id
                }),
              })

              const wavResult = await wavResponse.json()
              pipelineJob.steps[wavStepIndex].status = 'completed'
              pipelineJob.steps[wavStepIndex].taskId = wavResult.taskId
            }

            pipelineJob.status = 'completed'
            pipelineJob.finalResult = track
            
          } else if (job?.status === 'failed') {
            pipelineJob.steps[0].status = 'failed'
            pipelineJob.steps[0].error = job.error_message
            pipelineJob.status = 'failed'
            completed = true
          }
          
          attempts++
        }

        if (!completed) {
          pipelineJob.status = 'failed'
          pipelineJob.steps[0].status = 'failed'
          pipelineJob.steps[0].error = 'Timeout waiting for generation'
        }

      } catch (error) {
        console.error('Pipeline error:', error)
        pipelineJob.status = 'failed'
        pipelineJob.steps[pipelineJob.currentStep].status = 'failed'
        pipelineJob.steps[pipelineJob.currentStep].error = error.message
      }
    }

    // Запускаем пайплайн в фоне
    processPipeline().catch(console.error)

    return new Response(
      JSON.stringify({
        success: true,
        pipelineId,
        steps: pipelineJob.steps.map(s => ({ name: s.name, status: s.status })),
        message: 'Пайплайн генерации запущен'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error starting pipeline:', error)
    
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