// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    
    const { error } = await supabase
      .from('articles')
      .update({ 
        published: true,
        published_at: new Date().toISOString()
      })
      .eq('title', title);

    if (error) {
      console.error('Publish Error:', error);
      return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}