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

const SYS = `You write one-line scouting reads for an NBA draft big board.

You receive ONLY the raw facts supplied by the user. You may use nothing else.

RULES:
- Write ONE sentence on this prospect's draft positioning — the board dynamics, the variance, the split.
- Sharp, draft-room fluent. Zero corporate fluff.
- NEVER invent statistics, measurements, accolades, games, or rankings not provided. If the facts are thin, write about board dynamics — never fill in.
- Respond with ONLY valid JSON, no markdown, no extra text: {"read":"..."}`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name: string = String(body?.name || '').trim();
    if (!name) return NextResponse.json({ error: 'A name is required to draft the read.' }, { status: 400 });

    const pos = String(body?.pos || '').trim();
    const school = String(body?.school || '').trim();
    const trend = String(body?.trend || 'STEADY').trim().toUpperCase();
    const slot = String(body?.slot || '').trim();
    const range = String(body?.range || '').trim();

    const userPrompt = `Draft the scouting read for this prospect.
- Name: ${name}
- Position: ${pos || 'unspecified'}
- School: ${school || 'unspecified'}
- Trend: ${trend}
- Consensus slot: ${slot || 'unspecified'}
- Range: ${range || 'unspecified'}
Use only these facts. One line on his board positioning.`;

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
            max_tokens: 250,
            messages: [{ role: 'system', content: SYS }, { role: 'user', content: userPrompt }],
          }),
          signal: AbortSignal.timeout(20000),
        });
        if (!res.ok) continue;
        const data = await res.json();
        const parsed = extractJson(data.choices?.[0]?.message?.content);
        if (parsed?.read && String(parsed.read).trim()) {
          return NextResponse.json({ read: String(parsed.read).trim(), model, provider: p.name });
        }
      } catch { /* next provider */ }
    }

    return NextResponse.json({ error: 'No AI provider responded — write the read manually.' }, { status: 502 });

  } catch (error: any) {
    console.error('[draft-ai] Route error:', error);
    return NextResponse.json({ error: 'Failed to draft the read.' }, { status: 500 });
  }
}