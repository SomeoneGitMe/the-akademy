// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { title, source, takeaways, article, thumbnail_url, thumbnail_alt, thumbnail_caption, thumbnail_crop, tags, custom_title } = await req.json();
    
    const stringifiedResponse = JSON.stringify({ takeaways, article });

    const { error } = await supabase
      .from('articles')
      .update({ 
        content: stringifiedResponse,
        thumbnail_url: thumbnail_url,
        thumbnail_alt: thumbnail_alt,
        thumbnail_caption: thumbnail_caption,
        thumbnail_crop: thumbnail_crop,
        tags: tags || [],
        custom_title: custom_title || null
      })
      .eq('title', title);

    if (error) {
      console.error('Update Error:', error);
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}