import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, context = '', style = '', language = 'russian' } = await req.json();

    if (!type) {
      throw new Error('Type parameter is required');
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'music':
        systemPrompt = 'Ты профессиональный продюсер музыки. Создавай детальные, креативные описания музыкальных композиций на русском языке. Включай жанр, настроение, инструменты, темп и уникальные особенности.';
        userPrompt = `Создай описание для ${style || 'современной'} музыкальной композиции${context ? ` на тему: ${context}` : ''}. Сделай описание детальным и вдохновляющим.`;
        break;
        
      case 'lyrics':
        systemPrompt = `Ты талантливый автор песен. Создавай креативные описания для генерации текстов песен на ${language === 'english' ? 'английском' : 'русском'} языке. Описывай тему, эмоции, настроение и стиль лирики.`;
        userPrompt = `Создай описание для генерации текста песни в стиле ${style || 'поп'}${context ? ` на тему: ${context}` : ''}. Включи эмоциональную окраску и основную идею песни.`;
        break;
        
      case 'style':
        systemPrompt = 'Ты эксперт по музыкальным стилям. Улучшай и дополняй описания музыкальных стилей, добавляя профессиональные термины, характеристики звучания и производственные детали.';
        userPrompt = `Улучши и дополни это описание музыкального стиля: "${context}". Сделай его более профессиональным и детальным.`;
        break;
        
      case 'extend':
        systemPrompt = 'Ты музыкальный аранжировщик. Создавай описания для продолжения музыкальных композиций, учитывая структуру песни и логичные переходы.';
        userPrompt = `Создай описание для продолжения музыкального трека${context ? ` в стиле: ${context}` : ''}. Опиши как должен развиваться трек дальше - добавить ли соло, бридж, финальный припев или другие элементы.`;
        break;
        
      default:
        systemPrompt = 'Ты креативный помощник для создания музыки. Генерируй вдохновляющие и детальные описания для музыкальных проектов.';
        userPrompt = `Создай креативное описание${context ? ` на основе: ${context}` : ''}`;
    }

    console.log('Generating prompt with OpenAI:', { type, context, style, language });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const generatedPrompt = data.choices[0].message.content.trim();

    console.log('Generated prompt:', generatedPrompt);

    return new Response(JSON.stringify({ 
      success: true, 
      prompt: generatedPrompt,
      type,
      originalContext: context
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating prompt:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});