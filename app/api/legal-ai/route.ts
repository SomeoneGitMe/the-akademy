// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ============ PROVIDERS (tried in order) ============ */
const PROVIDERS = [
  { name: 'Cerebras', key: () => process.env.CEREBRAS_API_KEY, base: 'https://api.cerebras.ai/v1' },
  { name: 'Groq', key: () => process.env.GROQ_API_KEY, base: 'https://api.groq.com/openai/v1' },
];

/* ============ MODEL SCORING — never hardcode a model again ============ */
function scoreModel(id: string): number {
  const s = (id || '').toLowerCase();
  let score = 0;
  if (/llama[\s._-]*3[._-]?3/.test(s)) score += 40;
  else if (/llama[\s._-]*3[._-]?1/.test(s)) score += 30;
  else if (/gpt-oss/.test(s)) score += 35;
  else if (/llama/.test(s)) score += 15;
  if (/(70b|120b)/.test(s)) score += 25;
  else if (/8b/.test(s)) score += 5;
  if (/instruct|versatile|instant/.test(s)) score += 5;
  // Exclude non-chat models entirely
  if (/embed|whisper|guard|tts|rerank|vision|preview|deprecated|distil|moderation/.test(s)) score -= 100;
  return score;
}

async function discoverModel(p: { key: string; base: string }): Promise<string | null> {
  try {
    const res = await fetch(`${p.base}/models`, {
      headers: { Authorization: `Bearer ${p.key}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const ids = (data.data || []).map((m: any) => m.id).filter(Boolean);
    ids.sort((a: string, b: string) => scoreModel(b) - scoreModel(a));
    return ids[0] || null;
  } catch {
    return null;
  }
}

/* ============ BULLETPROOF JSON EXTRACTION ============ */
function extractJson(text: string): any {
  let t = (text || '').trim();
  t = t.replace(/^```(?:json)?/i, '').replace(/```$/g, '').trim();
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  try { return JSON.parse(t.slice(first, last + 1)); } catch { return null; }
}

/* ============ IN-MEMORY CACHE — decode once, serve free ============ */
const cache = new Map<string, any>();
const cacheKey = (t: string) => t.trim().toLowerCase().slice(0, 200);

const SYSTEM_PROMPT = `You are a legal analyst AI explaining U.S. legal concepts for a culturally literate hip-hop audience. You are not a lawyer and never claim to be.

OUTPUT RULES (STRICT):
- Respond with ONLY a valid JSON object. No markdown, no code fences, no extra text.
- Exact structure:
{"sections":[{"label":"CONCEPT","text":"..."},{"label":"PLAIN-ENGLISH BREAKDOWN","text":"..."},{"label":"KEY ELEMENTS","text":"..."},{"label":"REAL-WORLD APPLICATION","text":"..."}],"bottom_line":"..."}
- Labels are ALL-CAPS. Each text is 2-4 sentences, plain English, zero legalese.
- Cite statute codification (e.g., 18 U.S.C. § 1961) when relevant.
- REAL-WORLD APPLICATION should connect the concept to music-industry or hip-hop legal cases when possible.
- bottom_line is 2-3 sentences max.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const topic: string | undefined = body?.topic;
    if (!topic || topic.trim().length < 2) {
      return NextResponse.json({ error: 'A legal topic is required.' }, { status: 400 });
    }

    const key = cacheKey(topic);
    if (cache.has(key)) {
      return NextResponse.json(cache.get(key));
    }

    const userPrompt = `Explain this legal concept, statute, or document type in detail: "${topic.trim()}"`;

    const errors: string[] = [];

    for (const p of PROVIDERS) {
      const apiKey = p.key();
      if (!apiKey) { errors.push(`${p.name}: no API key in env`); continue; }

      const model = await discoverModel({ key: apiKey, base: p.base });
      if (!model) { errors.push(`${p.name}: no models discoverable`); continue; }

      try {
        const res = await fetch(`${p.base}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.6,
            max_tokens: 1200,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          errors.push(`${p.name}/${model}: ${res.status} ${errText.slice(0, 120)}`);
          continue;
        }

        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || '';
        const parsed = extractJson(content);

        if (!parsed || !Array.isArray(parsed.sections) || parsed.sections.length === 0) {
          errors.push(`${p.name}/${model}: unparseable JSON output`);
          continue;
        }

        const payload = {
          topic: topic.trim(),
          sections: parsed.sections.map((s: any) => ({ label: String(s.label || '').toUpperCase(), text: String(s.text || '') })).filter((s: any) => s.text),
          bottom_line: String(parsed.bottom_line || ''),
          model,
          provider: p.name,
          generated_at: new Date().toISOString(),
        };

        if (payload.sections.length === 0) {
          errors.push(`${p.name}/${model}: empty sections`);
          continue;
        }

        cache.set(key, payload);
        console.log(`[legal-ai] Served by ${p.name} / ${model}`);
        return NextResponse.json(payload);

      } catch (e: any) {
        errors.push(`${p.name}/${model}: ${e?.message || 'request failed'}`);
      }
    }

    console.error('[legal-ai] All providers failed:', errors.join(' | '));
    return NextResponse.json(
      { error: 'No AI provider responded. Check CEREBRAS_API_KEY / GROQ_API_KEY in .env.local.' },
      { status: 502 }
    );

  } catch (error: any) {
    console.error('[legal-ai] Route error:', error);
    return NextResponse.json({ error: 'Failed to generate decode.' }, { status: 500 });
  }
}