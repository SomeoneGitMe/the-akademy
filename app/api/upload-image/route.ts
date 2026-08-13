// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error } = await supabase.storage
      .from('article-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage Upload Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error('Server Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}