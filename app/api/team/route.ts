// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export const runtime = 'nodejs';

export async function GET() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role');
  
  if (error) return NextResponse.json({ team: [] }, { status: 500 });
  return NextResponse.json({ team: data || [] });
}

export async function PUT(req: NextRequest) {
  const { userId, newRole } = await req.json();
  
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}