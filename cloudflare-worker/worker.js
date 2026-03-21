/**
 * Cloudflare Worker — Gemini API Proxy
 * Receives OpenAI-compatible requests, converts to Gemini format, returns OpenAI-compatible responses
 */

const GEMINI_MODEL = 'gemini-2.0-flash';
const DAILY_LIMIT = 100;

function getRateLimitKey(ip) {
  const today = new Date().toISOString().slice(0, 10);
  return `${ip}:${today}`;
}

function getSecondsUntilUtcMidnight() {
  const now = new Date();
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0
  );
  return Math.max(60, Math.ceil((nextMidnight - now.getTime()) / 1000));
}

async function checkRateLimit(ip, env) {
  if (!env.RATE_LIMIT_KV) {
    return { allowed: true, remaining: null, mode: 'disabled' };
  }

  const key = getRateLimitKey(ip);
  const current = Number.parseInt((await env.RATE_LIMIT_KV.get(key)) || '0', 10);

  if (current >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, mode: 'kv' };
  }

  const nextCount = current + 1;
  await env.RATE_LIMIT_KV.put(key, String(nextCount), {
    expirationTtl: getSecondsUntilUtcMidnight()
  });

  return {
    allowed: true,
    remaining: Math.max(0, DAILY_LIMIT - nextCount),
    mode: 'kv'
  };
}

// Convert OpenAI messages to Gemini format
function convertToGemini(messages, temperature, maxTokens) {
  let systemInstruction = null;
  const contents = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction = { parts: [{ text: msg.content }] };
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  }

  const body = {
    contents,
    generationConfig: {
      temperature: temperature ?? 0.7,
      maxOutputTokens: maxTokens || 2000
    }
  };

  if (systemInstruction) {
    body.systemInstruction = systemInstruction;
  }

  return body;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Rate limiting
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await checkRateLimit(ip, env);
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ error: '今日请求次数已达上限，请明天再试' }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Mode': rateLimit.mode
        }
      });
    }

    try {
      if (!env.GEMINI_API_KEY) {
        return new Response(JSON.stringify({ error: 'Worker 未配置 GEMINI_API_KEY' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { messages, temperature, max_tokens } = await request.json();

      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'Invalid request: messages required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const geminiBody = convertToGemini(messages, temperature, max_tokens);

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
      const geminiResp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiBody)
      });

      if (!geminiResp.ok) {
        const errText = await geminiResp.text();
        return new Response(JSON.stringify({ error: `Gemini API error: ${errText}` }), {
          status: geminiResp.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const geminiData = await geminiResp.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!text) {
        return new Response(JSON.stringify({ error: 'Gemini 返回了空内容' }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Return OpenAI-compatible format
      const openaiResponse = {
        choices: [{
          message: { role: 'assistant', content: text }
        }]
      };

      return new Response(JSON.stringify(openaiResponse), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Mode': rateLimit.mode,
          ...(rateLimit.remaining !== null ? { 'X-RateLimit-Remaining': String(rateLimit.remaining) } : {})
        }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
