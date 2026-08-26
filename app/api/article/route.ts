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
    const { title: rawTitle, source, sourceText } = await req.json();
    const title = rawTitle.trim();

    const { data: existingArticle } = await supabase
      .from('articles')
      .select('content, published, thumbnail_url, thumbnail_alt, thumbnail_caption, thumbnail_crop, tags, custom_title, author_name, published_at')
      .eq('title', title)
      .maybeSingle();

    if (existingArticle && existingArticle.published) {
      const parsedContent = JSON.parse(existingArticle.content);
      return NextResponse.json({ 
        ...parsedContent, 
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
    A news story just broke. Here is the headline: "${title}" (Originally reported by ${source}).
    
    ${contextBlock}

    STRICT RULES & JOURNALISTIC TEMPLATE:
    1. ANTI-HALLUCINATION (EVENTS): Use ONLY the provided source text for the specific events, quotes, and actions that happened. DO NOT invent direct quotes or fake events.
    2. EXPANSION ALLOWED (CONTEXT): You MAY use your pre-trained knowledge to provide historical context, biographical background on the artists mentioned, and industry themes, but DO NOT use it to invent new news events.
    3. PACING: You must structure the article using the following pacing to ensure a robust, 600+ word article:
       - Introduction (approx 100 words): Hook the reader and state the core conflict using the primary data source.
       - The Catalyst (approx 150 words): Detail the original comments or event that sparked the story based on the source text.
       - The Rebuttal (approx 150 words): Explore the responses, fallout, or fallout based on the source text.
       - Industry Context (approx 150 words): Provide factual background on the artists' legacy or the genre's evolution using your pre-trained knowledge.
       - Conclusion (approx 100 words): Wrap up the significance of the event.
    4. TONE: Write in a grounded, natural, human tone. Do not sound like an AI.
    5. Do not use robotic transitions like "Furthermore", "In conclusion", or "Moreover".
    6. DO NOT use em dashes (—) or en dashes (–) anywhere. Use commas or parentheses instead.
    7. ATTRIBUTION: At the very bottom of the article text, you MUST include the exact line: "Originally reported by ${source}." Do not include this anywhere else in the article.
    8. Do NOT mention the original source or the context block anywhere else in the output.

    You must respond with a valid JSON object matching this exact structure. Do not include any other text or markdown blocks:
    {
      "custom_title": "An engaging, click-worthy, SEO-optimized headline for the article (different from the original raw title)",
      "takeaways": ["3 to 5 key bullet points summarizing ONLY the facts provided in the context"],
      "article": "The full 600+ word article formatted in Markdown following the Journalistic Template. In the exact middle of the article, include the placeholder: [ADMIN: INSERT IMAGE/VIDEO HERE]"
    }`;

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
      console.error(`Primary model ${modelId} failed:`, apiError?.error?.message || apiError?.message);
      console.log('Falling back to openai/gpt-oss-20b to bypass rate limits...');
      
      completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });
    }

    const parsedResponse = JSON.parse(completion.choices[0].message.content);
    const stringifiedResponse = JSON.stringify(parsedResponse);

    const { error } = await supabase
      .from('articles')
      .upsert({ 
        title, source, content: stringifiedResponse, published: false,
        thumbnail_url: null, tags: [], author_name: 'DJ Akademiks', published_at: null,
        thumbnail_caption: "", thumbnail_crop: { zoom: 1, x: 50, y: 50 },
        custom_title: parsedResponse.custom_title || null
      }, { onConflict: 'title' });

    if (error) console.error('Supabase Save Error:', error);

    return NextResponse.json({ 
      ...parsedResponse, published: false, thumbnail_url: null, thumbnail_alt: "", 
      thumbnail_caption: "", thumbnail_crop: { zoom: 1, x: 50, y: 50 },
      tags: [], custom_title: parsedResponse.custom_title || null, author_name: 'DJ Akademiks', published_at: null 
    });
  } catch (error) {
    console.error('Article Gen Error:', error);
    return NextResponse.json({ error: 'Failed to generate article' }, { status: 500 });
  }
}