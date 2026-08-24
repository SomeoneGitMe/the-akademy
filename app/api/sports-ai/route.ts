// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { prop } = await req.json();
    if (!prop || prop.trim().length < 4) {
      return NextResponse.json({ error: 'A valid prop bet is required.' }, { status: 400 });
    }

    const prompt = `You are a sharp sports betting analyst. A user entered this prop bet: "${prop}".
    Generate a "Scout Report" with 3 key insights (e.g., pace data, defensive matchup, recent form) and a final verdict.
    
    You must respond with ONLY a valid JSON object matching this exact structure. Do not include any other text or markdown formatting:
    {
      "insights": [
        {"label": "MATCHUP CONTEXT", "text": "Your insight here."},
        {"label": "RECENT FORM", "text": "Your insight here."},
        {"label": "TREND SIGNAL", "text": "Your insight here."}
      ],
      "verdict": "OVER",
      "verdict_reason": "One short sentence explaining the verdict.",
      "confidence": "85%"
    }`;

    // Native fetch bypasses OpenAI SDK routing issues
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3.1-8b', // Safest, permanently free Cerebras model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cerebras API Error:', response.status, errorText);
      return NextResponse.json({ error: `Cerebras API Error: ${response.status}` }, { status: 500 });
    }

    const data = await response.json();
    let rawResponse = data.choices[0].message.content.trim();

    // Bulletproof JSON parsing
    if (rawResponse.startsWith("```json")) rawResponse = rawResponse.substring(7);
    if (rawResponse.startsWith("```")) rawResponse = rawResponse.substring(3);
    if (rawResponse.endsWith("```")) rawResponse = rawResponse.substring(0, rawResponse.length - 3);
    rawResponse = rawResponse.trim();

    const parsedResponse = JSON.parse(rawResponse);
    return NextResponse.json(parsedResponse);

  } catch (error) {
    console.error('Sports AI Error:', error);
    return NextResponse.json({ error: 'Failed to generate scout report' }, { status: 500 });
  }
}