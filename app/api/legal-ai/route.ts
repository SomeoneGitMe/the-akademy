// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: 'A legal topic is required.' }, { status: 400 });
    }

    const prompt = `You are a legal analyst AI. Explain this legal concept/statute in plain English for a culturally literate audience: "${topic}".
    Break it down into sections.
    
    You must respond with ONLY a valid JSON object matching this exact structure. Do not include any other text or markdown formatting:
    {
      "sections": [
        {"label": "CONCEPT", "text": "Brief definition."},
        {"label": "PLAIN-ENGLISH BREAKDOWN", "text": "Detailed explanation."},
        {"label": "KEY ELEMENTS", "text": "What the prosecution must prove."},
        {"label": "REAL-WORLD APPLICATION", "text": "How it applies to the music industry."}
      ],
      "bottom_line": "2-3 sentences summarizing the takeaway."
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
        temperature: 0.6,
        max_tokens: 1000
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
    console.error('Legal AI Error:', error);
    return NextResponse.json({ error: 'Failed to generate legal breakdown' }, { status: 500 });
  }
}