// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '../../utils/supabaseClient';

export const runtime = 'nodejs';

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: "https://api.groq.com/openai/v1"
});

export async function POST(req: NextRequest) {
  try {
    const { title: rawTitle, source } = await req.json();
    const title = rawTitle.trim();

    const { data: existingArticle } = await supabase
      .from('articles')
      .select('content, published, thumbnail_url, thumbnail_alt, thumbnail_caption, thumbnail_crop, tags, custom_title, author_name, published_at')
      .eq('title', title)
      .maybeSingle();

    if (existingArticle && existingArticle.content) {
      return NextResponse.json({ 
        ...JSON.parse(existingArticle.content), 
        published: existingArticle.published,
        thumbnail_url: existingArticle.thumbnail_url,
        thumbnail_alt: existingArticle.thumbnail_alt || "",
        thumbnail_caption: existingArticle.thumbnail_caption || "",
        thumbnail_crop: existingArticle.thumbnail_crop || { zoom: 1, x: 50, y: 50 },
        tags: existingArticle.tags || [],
        custom_title: existingArticle.custom_title || null,
        author_name: existingArticle.author_name || 'DJ Akademiks',
        published_at: existingArticle.published_at || null
      });
    }

    const prompt = `You are a senior writer for 'The Akademy', a premium hip-hop media platform. 
    A news story just broke. Here is the headline: "${title}" (Originally reported by ${source}).
    
    Write a comprehensive, 6-paragraph article breaking down this event. 
    
    STRICT RULES:
    1. DO NOT use em dashes (—) or en dashes (–) anywhere. Use commas or parentheses instead.
    2. Write in a grounded, natural, human tone. Do not sound like an AI.
    3. Do not use robotic transitions like "Furthermore", "In conclusion", or "Moreover".
    4. Focus on facts, context, and truth-seeking rather than mere speculation.
    5. Intelligently integrate SEO keywords naturally. Do not keyword stuff.
    6. Do NOT mention the original source in the output.

    You must respond with a valid JSON object matching this exact structure. Do not include any other text or markdown blocks:
    {
      "takeaways": ["Bullet point 1", "Bullet point 2", "Bullet point 3"],
      "article": "The 6 paragraphs of the story formatted in Markdown. In the exact middle of the article, include the placeholder: [ADMIN: INSERT IMAGE/VIDEO HERE]"
    }`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const parsedResponse = JSON.parse(completion.choices[0].message.content);
    const stringifiedResponse = JSON.stringify(parsedResponse);

    const { error } = await supabase
      .from('articles')
      .upsert({ 
        title, source, content: stringifiedResponse, published: false,
        thumbnail_url: null, tags: [], author_name: 'DJ Akademiks', published_at: null,
        thumbnail_caption: "", thumbnail_crop: { zoom: 1, x: 50, y: 50 }
      }, { onConflict: 'title' });

    if (error) console.error('Supabase Save Error:', error);

    return NextResponse.json({ 
      ...parsedResponse, published: false, thumbnail_url: null, thumbnail_alt: "", 
      thumbnail_caption: "", thumbnail_crop: { zoom: 1, x: 50, y: 50 },
      tags: [], custom_title: null, author_name: 'DJ Akademiks', published_at: null 
    });
  } catch (error) {
    console.error('Article Gen Error:', error);
    return NextResponse.json({ error: 'Failed to generate article' }, { status: 500 });
  }
}