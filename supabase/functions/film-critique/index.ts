import { buildPrompt, type ShotContext } from './prompt.ts';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Tried in order. Checked against GET /v1/models on 2026-07-28: qwen3.6-27b is
 * the only vision-capable model on this account — every llama vision model has
 * been decommissioned, which is also why the sibling analyze-food function's
 * scanning is currently broken.
 *
 * Groq rotates these often. When critiques start failing, list the current
 * models and put a working one in the GROQ_MODEL secret, which overrides this
 * list without a redeploy:
 *   curl -s https://api.groq.com/openai/v1/models -H "Authorization: Bearer $KEY"
 */
const VISION_MODELS = Deno.env.get('GROQ_MODEL')
  ? [Deno.env.get('GROQ_MODEL')!]
  : ['qwen/qwen3.6-27b'];

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
  const errors: string[] = [];

  for (let i = 0; i < VISION_MODELS.length; i++) {
    const model = VISION_MODELS[i];
    const isLast = i === VISION_MODELS.length - 1;

    /**
     * qwen3.6 is a reasoning model: left to itself it emits a long <think>
     * block, exhausts the token budget before writing any JSON, and Groq
     * rejects the call with json_validate_failed and an EMPTY
     * failed_generation — which looks like a model fault rather than a
     * reasoning one. Turning reasoning off fixes it and cuts a critique to
     * ~400 completion tokens.
     *
     * Not every model accepts reasoning_effort, so if one rejects the
     * parameter the same request is retried without it.
     */
    const send = (withReasoningEffort: boolean) => fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        // Comfortably above the ~400 a critique needs, and well inside the
        // free tier's 8k tokens/minute alongside a ~1800-token image.
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        ...(withReasoningEffort ? { reasoning_effort: 'none' } : {}),
        messages,
      }),
    });

    let groqResponse: Response;
    try {
      groqResponse = await send(true);
      if (groqResponse.status === 400) {
        const body = await groqResponse.clone().text();
        if (/reasoning/i.test(body)) groqResponse = await send(false);
      }
    } catch (e) {
      // Network-level failure: DNS, timeout, connection reset.
      errors.push(`${model}: ${(e as Error).message}`);
      if (isLast) return json({ error: 'Could not reach Groq', detail: errors.join(' | ') }, 502);
      continue;
    }

    if (groqResponse.ok) {
      const body = await groqResponse.json();
      const candidate = body.choices?.[0]?.message?.content;
      if (typeof candidate === 'string') { content = candidate; break; }
      errors.push(`${model}: returned no content`);
      if (isLast) break;
      continue;
    }

    // Any non-2xx: try the next model rather than guessing from the error
    // text whether this model is unavailable. Groq's wording varies, and a
    // regex that misses a phrasing would strand the fallback on the first
    // model. Only the last model's failure is terminal.
    const detail = await groqResponse.text();
    errors.push(`${model}: ${detail}`);
    if (isLast) {
      // The free tier allows 8k tokens a minute and one critique uses most of
      // it, so this is the failure a real user hits — say what to do about it.
      const rateLimited = groqResponse.status === 429;
      return json({
        error: rateLimited
          ? 'Groq rate limit reached — wait a minute and try again.'
          : 'Groq request failed',
        detail: errors.join(' | '),
      }, 502);
    }
  }

  if (typeof content !== 'string') {
    return json({ error: 'No vision model was available', detail: errors.join(' | ') }, 502);
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
