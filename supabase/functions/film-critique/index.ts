import { buildPrompt, type ShotContext } from './prompt.ts';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Tried in order. Groq rotates vision models, and the sibling analyze-food
 * function on this project confirms llama-4-scout works on this account, so
 * it backs up the current documented model. GROQ_MODEL overrides the list.
 */
const VISION_MODELS = Deno.env.get('GROQ_MODEL')
  ? [Deno.env.get('GROQ_MODEL')!]
  : ['qwen/qwen3.6-27b', 'meta-llama/llama-4-scout-17b-16e-instruct'];

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SECTIONS = ['exposure', 'focus', 'motion', 'depth_of_field'] as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** Reject anything that is not the shape the app renders. */
function validate(parsed: unknown): boolean {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const c = parsed as Record<string, unknown>;
  for (const key of SECTIONS) {
    const section = c[key] as Record<string, unknown> | undefined;
    if (!section || typeof section.verdict !== 'string'
        || typeof section.explanation !== 'string'
        || !['low', 'medium', 'high'].includes(section.confidence as string)) {
      return false;
    }
  }
  return typeof c.overall === 'string' && Array.isArray(c.next_time);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) return json({ error: 'GROQ_API_KEY is not configured' }, 500);

  let payload: { imageBase64?: string; context?: ShotContext };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Body must be JSON' }, 400);
  }

  const { imageBase64, context } = payload;
  if (!imageBase64 || !context) {
    return json({ error: 'imageBase64 and context are both required' }, 400);
  }

  const messages = [{
    role: 'user',
    content: [
      { type: 'text', text: buildPrompt(context) },
      {
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
      },
    ],
  }];

  let content: string | undefined;
  let lastError = '';

  for (const model of VISION_MODELS) {
    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
        messages,
      }),
    });

    if (groqResponse.ok) {
      const body = await groqResponse.json();
      const candidate = body.choices?.[0]?.message?.content;
      if (typeof candidate === 'string') { content = candidate; break; }
      lastError = `${model}: returned no content`;
      continue;
    }

    // A retired or unavailable model should fall through to the next one;
    // anything else is a real failure worth surfacing immediately.
    const detail = await groqResponse.text();
    const retryable = groqResponse.status === 404 || groqResponse.status === 429
      || /not found|not support|decommission/i.test(detail);
    lastError = `${model}: ${detail}`;
    if (!retryable) return json({ error: 'Groq request failed', detail }, 502);
  }

  if (typeof content !== 'string') {
    return json({ error: 'No vision model was available', detail: lastError }, 502);
  }

  let critique: unknown;
  try {
    critique = JSON.parse(content);
  } catch {
    return json({ error: 'Groq returned malformed JSON', detail: content }, 502);
  }

  if (!validate(critique)) {
    return json({ error: 'Critique was missing required sections', detail: critique }, 502);
  }

  return json(critique);
});
