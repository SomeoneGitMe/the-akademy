// @ts-nocheck
import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('title, source, thumbnail_url, created_at')
      .eq('published', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch Drafts Error:', error);
      return NextResponse.json({ drafts: [] });
    }

    return NextResponse.json({ drafts: data });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ drafts: [] });
  }
}