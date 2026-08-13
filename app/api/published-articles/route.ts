// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('title, source, thumbnail_url, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Fetch Error:', error);
      return NextResponse.json({ articles: [] });
    }

    return NextResponse.json({ articles: data });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ articles: [] });
  }
}