// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient'; // Fixed path: went up two directories instead of three

export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  try {
    const { title } = await req.json();
    
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('title', title);

    if (error) {
      console.error('Delete Error:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}