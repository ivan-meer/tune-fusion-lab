import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnhancementRequest {
  prompt: string;
  style?: string;
  targetLanguage?: string;
  enhancementType: 'style' | 'lyrics' | 'structure' | 'complete';
}

interface EnhancementResult {
  success: boolean;
  enhancedPrompt?: string;
  musicStyle?: string;
  suggestedLyrics?: string;
  structuralTags?: string;
  error?: string;
  method: 'openai' | 'fallback';
  tokensUsed?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, style = '', targetLanguage = 'russian', enhancementType = 'complete' }: EnhancementRequest = await req.json();

    if (!prompt?.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Prompt is required',
        method: 'fallback'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Try OpenAI enhancement first
    const openAiKey = Deno.env.get('OPENAI_API_KEY');
    if (openAiKey) {
      try {
        const result = await enhanceWithOpenAI(prompt, style, targetLanguage, enhancementType, openAiKey);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (openAiError) {
        console.error('OpenAI enhancement failed:', openAiError);
        // Fall through to local enhancement
      }
    }

    // Fallback to local enhancement
    const result = enhanceLocally(prompt, style, enhancementType);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Enhancement error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      method: 'fallback'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function enhanceWithOpenAI(
  prompt: string, 
  style: string, 
  language: string, 
  enhancementType: string,
  apiKey: string
): Promise<EnhancementResult> {
  const systemPrompts = {
    style: `You are a music production expert. Transform the user's basic prompt into a detailed, professional music style description. Focus on instrumentation, production techniques, sound design, and musical arrangements. Respond in ${language}.`,
    
    lyrics: `You are a professional songwriter. Create compelling lyrics based on the user's prompt. Include proper song structure with [Verse], [Chorus], [Bridge] tags. Make it emotional and memorable. Respond in ${language}.`,
    
    structure: `You are a music structure expert. Analyze the prompt and suggest the optimal song structure with timing and arrangement details. Include BPM, key suggestions, and instrumental breakdown. Respond in ${language}.`,
    
    complete: `You are a comprehensive music AI assistant. Transform the user's prompt into:
1. Enhanced style description with technical details
2. Suggested song structure and arrangement
3. Production notes and instrumentation
4. Brief lyrical theme suggestions
Provide a professional, detailed music production brief. Respond in ${language}.`
  };

  const userPrompt = `Original prompt: "${prompt}"
Style context: "${style}"

Please enhance this into a professional music production description.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompts[enhancementType] || systemPrompts.complete },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const enhancedContent = data.choices[0].message.content;

  // Parse structured response if possible
  let musicStyle = '';
  let suggestedLyrics = '';
  let structuralTags = '';

  if (enhancementType === 'complete') {
    // Try to extract different sections
    const styleMatch = enhancedContent.match(/(?:стиль|style)[:\-]\s*([^\n]+)/i);
    const lyricsMatch = enhancedContent.match(/(?:лирика|lyrics)[:\-]\s*([^\n]+)/i);
    const structureMatch = enhancedContent.match(/(?:структура|structure)[:\-]\s*([^\n]+)/i);
    
    musicStyle = styleMatch?.[1] || '';
    suggestedLyrics = lyricsMatch?.[1] || '';
    structuralTags = structureMatch?.[1] || '';
  }

  return {
    success: true,
    enhancedPrompt: enhancedContent,
    musicStyle: musicStyle || enhancedContent,
    suggestedLyrics,
    structuralTags,
    method: 'openai',
    tokensUsed: data.usage?.total_tokens || 0
  };
}

function enhanceLocally(prompt: string, style: string, enhancementType: string): EnhancementResult {
  const enhancements = {
    style: [
      'с богатой многослойной аранжировкой и профессиональным студийным звучанием',
      'с кинематографичным размахом и оркестровыми элементами',
      'с современным продакшеном и пространственными эффектами',
      'с глубоким басом, четкой ритм-секцией и динамичными переходами',
      'с атмосферными подложками, реверберацией и эмоциональной подачей',
      'с запоминающимся мелодическим крюком и гармоничными аккордами',
      'с виртуозными соло-партиями и технически совершенным исполнением',
      'с экспериментальными звуковыми текстурами и инновационным подходом'
    ],
    
    production: [
      'стереопанорама с широким звуковым полем',
      'многополосная компрессия и лимитинг',
      'профессиональный мастеринг для стриминговых платформ',
      'живая акустика с естественной реверберацией',
      'аналоговое тепло в сочетании с цифровой точностью',
      'динамический диапазон с контрастными секциями'
    ],
    
    instruments: {
      pop: ['синтезаторы', 'электропианино', 'бас-гитара', 'ударные', 'струнные секции'],
      rock: ['электрогитары', 'бас-гитара', 'мощные барабаны', 'синтезаторы', 'хор'],
      electronic: ['аналоговые синтезаторы', 'драм-машины', 'семплы', 'FM-синтез', 'модулярные системы'],
      classical: ['струнный оркестр', 'духовые инструменты', 'рояль', 'арфа', 'литавры'],
      jazz: ['саксофон', 'рояль', 'контрабас', 'ударные', 'труба', 'тромбон'],
      ambient: ['синтезаторные пады', 'полевые записи', 'эффекты задержки', 'модульная система']
    }
  };

  const selectedEnhancement = enhancements.style[Math.floor(Math.random() * enhancements.style.length)];
  const selectedProduction = enhancements.production[Math.floor(Math.random() * enhancements.production.length)];
  const styleInstruments = enhancements.instruments[style.toLowerCase()] || enhancements.instruments.pop;
  const selectedInstruments = styleInstruments.slice(0, 3).join(', ');

  const enhancedPrompt = `${prompt}, ${selectedEnhancement}, с акцентом на ${selectedInstruments}, ${selectedProduction}`;

  // Generate structural suggestions
  const structures = {
    pop: '[Intro] [Verse 1] [Pre-Chorus] [Chorus] [Verse 2] [Chorus] [Bridge] [Final Chorus] [Outro]',
    rock: '[Intro] [Verse 1] [Chorus] [Verse 2] [Chorus] [Guitar Solo] [Bridge] [Final Chorus] [Outro]',
    electronic: '[Intro] [Build-up] [Drop] [Breakdown] [Build-up] [Drop] [Bridge] [Final Drop] [Outro]',
    ballad: '[Intro] [Verse 1] [Chorus] [Verse 2] [Chorus] [Bridge] [Final Chorus] [Outro]'
  };

  const structuralTags = structures[style.toLowerCase()] || structures.pop;

  return {
    success: true,
    enhancedPrompt,
    musicStyle: `${style} стиль с ${selectedInstruments}`,
    structuralTags,
    method: 'fallback'
  };
}