import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

async function assertAdmin(supabase, service, userId) {
  const { data } = await service.from('profiles').select('role').eq('id', userId).single();
  return data?.role === 'admin';
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  if (!await assertAdmin(supabase, service, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data, error } = await service
    .from('cleaner_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data });
}
