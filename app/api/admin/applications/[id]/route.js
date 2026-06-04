import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function PATCH(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { status, service_zips } = await request.json();

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data: app, error: appErr } = await service
    .from('cleaner_applications')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 });

  // On approval, find the matching auth user by email and create/update their cleaner row
  if (status === 'approved') {
    const { data: authUsers } = await service.auth.admin.listUsers();
    const matchedUser = authUsers?.users?.find(u => u.email === app.email);

    if (matchedUser) {
      // Update profile role to cleaner
      await service.from('profiles').update({ role: 'cleaner', full_name: `${app.first_name} ${app.last_name}`, phone: app.phone }).eq('id', matchedUser.id);

      // Upsert cleaner row
      await service.from('cleaners').upsert({
        user_id:        matchedUser.id,
        bg_check_status: 'cleared',
        is_active:      true,
        service_zips:   service_zips || app.service_zips || [],
      }, { onConflict: 'user_id' });
    }
  }

  return NextResponse.json({ application: app });
}
