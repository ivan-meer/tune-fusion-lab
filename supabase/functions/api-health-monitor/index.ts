import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  error?: string;
  timestamp: string;
}

// Проверка здоровья Suno API
async function checkSunoHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const sunoApiKey = Deno.env.get('SUNO_API_KEY');
  
  if (!sunoApiKey) {
    return {
      provider: 'suno',
      status: 'unhealthy',
      responseTime: 0,
      error: 'API key not configured',
      timestamp: new Date().toISOString()
    };
  }

  try {
    const response = await fetch('https://api.sunoapi.org/api/v1/generate/credit', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sunoApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        provider: 'suno',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }

    const data = await response.json();
    
    return {
      provider: 'suno',
      status: responseTime > 5000 ? 'degraded' : 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      provider: 'suno',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Проверка здоровья Mureka API
async function checkMurekaHealth(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const murekaApiKey = Deno.env.get('MUREKA_API_KEY');
  
  if (!murekaApiKey) {
    return {
      provider: 'mureka',
      status: 'degraded', // Не критично, есть fallback на Suno
      responseTime: 0,
      error: 'API key not configured',
      timestamp: new Date().toISOString()
    };
  }

  try {
    // Простой запрос для проверки доступности API
    const response = await fetch('https://platform.mureka.ai/v1/health', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${murekaApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      // Для Mureka проверим альтернативным способом
      if (response.status === 404) {
        // Endpoint /health может не существовать, это нормально
        return {
          provider: 'mureka',
          status: responseTime > 10000 ? 'degraded' : 'healthy',
          responseTime,
          timestamp: new Date().toISOString()
        };
      }

      return {
        provider: 'mureka',
        status: 'unhealthy',
        responseTime,
        error: `HTTP ${response.status}`,
        timestamp: new Date().toISOString()
      };
    }

    return {
      provider: 'mureka',
      status: responseTime > 10000 ? 'degraded' : 'healthy',
      responseTime,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      provider: 'mureka',
      status: 'degraded', // Не критично для общей работы системы
      responseTime: Date.now() - startTime,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Основная функция мониторинга
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🏥 Starting API health check...');

    // Параллельная проверка всех API
    const [sunoHealth, murekaHealth] = await Promise.all([
      checkSunoHealth(),
      checkMurekaHealth()
    ]);

    const results = [sunoHealth, murekaHealth];
    
    // Определяем общий статус системы
    const hasUnhealthy = results.some(r => r.status === 'unhealthy');
    const hasDegraded = results.some(r => r.status === 'degraded');
    
    let overallStatus = 'healthy';
    if (hasUnhealthy) {
      overallStatus = 'unhealthy';
    } else if (hasDegraded) {
      overallStatus = 'degraded';
    }

    // Логируем результаты
    console.log('📊 Health check results:', {
      overall: overallStatus,
      providers: results
    });

    // Сохраняем в базу данных для мониторинга
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      for (const result of results) {
        await supabase
          .from('api_health_logs')
          .insert({
            provider: result.provider,
            status: result.status,
            response_time: result.responseTime,
            error_message: result.error,
            checked_at: result.timestamp
          });
      }
    } catch (dbError) {
      console.error('⚠️ Failed to save health check to database:', dbError.message);
    }

    // Возвращаем результат
    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      providers: results,
      summary: {
        healthy: results.filter(r => r.status === 'healthy').length,
        degraded: results.filter(r => r.status === 'degraded').length,
        unhealthy: results.filter(r => r.status === 'unhealthy').length
      }
    };

    return new Response(JSON.stringify(response), {
      status: overallStatus === 'unhealthy' ? 503 : 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      error: 'Health check system failure',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});