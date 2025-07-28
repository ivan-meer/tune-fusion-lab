import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Функция для тестирования реального API Mureka
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testType = 'basic' } = await req.json();
    
    const murekaApiKey = Deno.env.get('MUREKA_API_KEY');
    if (!murekaApiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'MUREKA_API_KEY not configured'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('🧪 Testing Mureka API with test type:', testType);

    let testRequest;
    
    if (testType === 'basic') {
      testRequest = {
        mode: 'basic',
        title: 'Test Song',
        lyrics: 'This is a test song for API validation',
        style: 'pop',
        duration: 30,
        language: 'en',
        instrumental: false,
        quality: 'high',
        output_format: 'mp3'
      };
    } else {
      testRequest = {
        mode: 'advanced',
        title: 'Advanced Test Track',
        style: 'electronic',
        duration: 60,
        language: 'en',
        instrumental: true,
        custom_tags: ['electronic', 'test'],
        quality: 'high',
        output_format: 'mp3'
      };
    }

    console.log('📤 Sending test request to Mureka:', testRequest);

    // Тестовый запрос к реальному API
    const response = await fetch('https://platform.mureka.ai/v1/song/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${murekaApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Supabase-Functions/1.0'
      },
      body: JSON.stringify(testRequest),
    });

    console.log(`📡 Mureka API response status: ${response.status}`);
    
    const responseText = await response.text();
    console.log('📥 Mureka API response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      responseData = { raw: responseText };
    }

    const result = {
      success: response.ok,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      testType,
      timestamp: new Date().toISOString()
    };

    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${responseText}`;
    }

    // Логируем результат в базу данных
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabase
        .from('api_health_logs')
        .insert({
          provider: 'mureka-test',
          status: response.ok ? 'healthy' : 'unhealthy',
          response_time: 0, // Время отклика не измеряем в тесте
          error_message: result.error,
          checked_at: new Date().toISOString()
        });
    } catch (dbError) {
      console.warn('⚠️ Failed to log test result to database:', dbError.message);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Mureka test failed:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});