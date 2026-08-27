// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '../../utils/supabaseClient';
import { getDynamicModel } from '@/lib/ai-router';

export const runtime = 'nodejs';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1"
});

export async function POST(req: NextRequest) {
  try {
    const { title: rawTitle, source: sourceParam, sourceText, sourceLink: sourceLinkParam } = await req.json();
    const title = rawTitle.trim();

    const { data: existingArticle } = await supabase
      .from('articles')
      .select('content, source, published, thumbnail_url, thumbnail_alt, thumbnail_caption, thumbnail_crop, tags, custom_title, author_name, published_at')
      .eq('title', title)
      .maybeSingle();

    if (existingArticle && existingArticle.content) {
      const parsedContent = JSON.parse(existingArticle.content);
      return NextResponse.json({ 
        ...parsedContent,
        source: existingArticle.source || sourceParam,
        published: existingArticle.published,
        thumbnail_url: existingArticle.thumbnail_url,
        thumbnail_alt: existingArticle.thumbnail_alt || "",
        thumbnail_caption: existingArticle.thumbnail_caption || "",
        thumbnail_crop: existingArticle.thumbnail_crop || { zoom: 1, x: 50, y: 50 },
        tags: existingArticle.tags || [],
        custom_title: existingArticle.custom_title || parsedContent.custom_title || null,
        author_name: existingArticle.author_name || 'DJ Akademiks',
        published_at: existingArticle.published_at || null
      });
    }

    const contextBlock = sourceText ? `
    Here are the facts and source materials gathered from multiple outlets regarding this story:
    ---
    ${sourceText}
    ---
    ` : `
    (No source text was provided. Write a brief 1-paragraph article based strictly on the headline above. Do NOT invent details.)
    `;

    const prompt = `You are a senior writer for 'The Akademy', a premium hip-hop media platform. 
    A news story just broke. Here is the headline: "${title}".
    
    ${contextBlock}

    STRICT RULES & JOURNALISTIC TEMPLATE:
    1. ANTI-HALLUCINATION: Use ONLY the provided source text for events. DO NOT invent fake events.
    2. FORMATTING: Write a 600+ word article. 5-6 standard text paragraphs. No subheadings.
    3. TONE: Grounded, natural, human tone. Do not sound like an AI.
    4. DO NOT use em dashes (—). 
    5. Do NOT include any "Originally reported by" text. The system handles that.
    6. CRITICAL: The "takeaways" array must contain ONLY factual bullet points about the news event. Do NOT mention the source name (e.g., Billboard, Complex) in the takeaways.

    Respond with JSON: {"custom_title": "...", "takeaways": ["3 facts"], "article": "..."}`;

    const modelId = await getDynamicModel();
    let completion;

    try {
      completion = await groq.chat.completions.create({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });
    } catch (apiError: any) {
      completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });
    }

    const parsedResponse = JSON.parse(completion.choices[0].message.content);
    
    // GUARANTEED HYPERLINK INJECTION
    if (parsedResponse.article) {
      if (sourceLinkParam) {
        parsedResponse.article += `\n\n*Originally reported by [${sourceParam}](${sourceLinkParam}).*`;
      } else {
        parsedResponse.article += `\n\n*Originally reported by ${sourceParam}.*`;
      }
    }

    const stringifiedResponse = JSON.stringify(parsedResponse);

    const { error } = await supabase
      .from('articles')
      .upsert({ 
        title, source: sourceParam, content: stringifiedResponse, published: false,
        thumbnail_url: null, tags: [], author_name: 'DJ Akademiks', published_at: null,
        thumbnail_caption: "", thumbnail_crop: { zoom: 1, x: 50, y: 50 },
        custom_title: parsedResponse.custom_title || null
      }, { onConflict: 'title' });

    return NextResponse.json({ 
      ...parsedResponse, 
      source: sourceParam,
      published: false, thumbnail_url: null, thumbnail_alt: "", 
      thumbnail_caption: "", thumbnail_crop: { zoom: 1, x: 50, y: 50 },
      tags: [], custom_title: parsedResponse.custom_title || null, author_name: 'DJ Akademiks', published_at: null 
    });
  } catch (error) {
    console.error('Article Gen Error:', error);
    return NextResponse.json({ error: 'Failed to generate article' }, { status: 500 });
  }
}