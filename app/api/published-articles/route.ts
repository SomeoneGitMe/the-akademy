// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('title, source, thumbnail_url, created_at, tags')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Fetch Error:', error);
      return NextResponse.json({ articles: [] });
    }

    // Ensure tags are always an array of lowercase strings
    const articles = (data || []).map(article => ({
      ...article,
      tags: Array.isArray(article.tags) 
        ? article.tags.map(t => String(t).toLowerCase()) 
        : (typeof article.tags === 'string' ? article.tags.split(',').map(t => t.trim().toLowerCase()) : [])
    }));

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ articles: [] });
  }
}