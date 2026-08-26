// ai-router.ts
// Drop this into any project to future-proof Groq model calls.

interface ModelCache {
  models: string[];
  lastFetched: number;
}

let modelCache: ModelCache = { models: [], lastFetched: 0 };
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

export async function getDynamicModel(): Promise<string> {
  const now = Date.now();
  const baseUrl = 'https://api.groq.com/openai/v1/models';
  const apiKey = process.env.GROQ_API_KEY;

  // 1. Return cached model if valid
  if (now - modelCache.lastFetched < CACHE_TTL && modelCache.models.length > 0) {
    return selectBestModel(modelCache.models);
  }

  try {
    // 2. Fetch live models from Groq
    const response = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) throw new Error('Failed to fetch models');
    
    const data = await response.json();
    const availableModels: string[] = data.data.map((m: any) => m.id);
    
    // 3. Update Cache
    modelCache = {
      models: availableModels,
      lastFetched: now,
    };

    return selectBestModel(availableModels);
  } catch (error) {
    // 4. Hard fallback
    return 'llama-3.1-8b-instant';
  }
}

function selectBestModel(models: string[]): string {
  // Priority 1: OpenAI GPT OSS Models (Since you have access to these)
  const gpt120 = models.find(m => m.includes('gpt-oss-120b'));
  if (gpt120) return gpt120;

  const gpt20 = models.find(m => m.includes('gpt-oss-20b'));
  if (gpt20) return gpt20;

  // Priority 2: Llama 3.3 70b
  const preferred70b = models.find(m => m.includes('llama-3.3-70b'));
  if (preferred70b) return preferred70b;
  
  // Priority 3: Llama 3.1 8b Instant (Universal Access)
  const fallback8b = models.find(m => m.includes('llama-3.1-8b-instant'));
  if (fallback8b) return fallback8b;

  // Priority 4: Gemma 2 9b
  const gemma = models.find(m => m.includes('gemma2-9b'));
  if (gemma) return gemma;

  // Absolute default
  return 'llama-3.1-8b-instant';
}