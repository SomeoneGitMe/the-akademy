// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROVIDERS = [
  { name: 'Cerebras', key: () => process.env.CEREBRAS_API_KEY, base: 'https://api.cerebras.ai/v1' },
  { name: 'Groq', key: () => process.env.GROQ_API_KEY, base: 'https://api.groq.com/openai/v1' },
];

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
  } catch { return null; }
}

function extractJson(text: string): any {
  let t = (text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/g, '').trim();
  const first = t.indexOf('{'); const last = t.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  try { return JSON.parse(t.slice(first, last + 1)); } catch { return null; }
}

const SYS = `You write single editorial lines for a music-industry executive-moves tracker called "The Read."

You receive ONLY the raw facts of a personnel move, supplied by the user. You may use nothing else.

RULES:
- Write 1-2 sentences on why this move matters to the business of music.
- Sharp, direct, bottom-line focused. Culturally fluent. Zero corporate fluff.
- NEVER invent statistics, deal values, dates, titles, or any names or companies not provided.
- If a fact is thin, write around it — never fill it in.
- Respond with ONLY valid JSON, no markdown, no extra text: {"impact":"..."}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name: string = String(body?.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'A name is required to draft the read.' }, { status: 400 });
    }
    const from = String(body?.from || '—').trim() || '—';
    const to = String(body?.to || '—').trim() || '—';
    const role = String(body?.role || '').trim();
    const type = String(body?.type || 'HIRE').trim().toUpperCase();

    const userPrompt = `Draft The Read for this move.
- Executive: ${name}
- Role: ${role || 'unspecified'}
- Move type: ${type}
- From: ${from}
- To: ${to}
Use only these facts. One editorial line on why it matters.`;

    for (const p of PROVIDERS) {
      const apiKey = p.key();
      if (!apiKey) continue;
      const model = await discoverModel({ key: apiKey, base: p.base });
      if (!model) continue;
      try {
        const res = await fetch(`${p.base}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model,
            temperature: 0.6,
            max_tokens: 300,
            messages: [{ role: 'system', content: SYS }, { role: 'user', content: userPrompt }],
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        const parsed = extractJson(content);
        if (parsed?.impact && String(parsed.impact).trim()) {
          return NextResponse.json({ impact: String(parsed.impact).trim(), model, provider: p.name });
        }
      } catch { /* next provider */ }
    }

    return NextResponse.json({ error: 'No AI provider responded — write the read manually.' }, { status: 502 });

  } catch (error: any) {
    console.error('[exec-moves-ai] Route error:', error);
    return NextResponse.json({ error: 'Failed to draft the read.' }, { status: 500 });
  }
}