import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();

  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [bookings, cleaners, applications, revenue] = await Promise.all([
    service.from('bookings').select('id, status, total_price, created_at'),
    service.from('cleaners').select('id, is_active, bg_check_status, rating, jobs_completed'),
    service.from('cleaner_applications').select('id, status, created_at'),
    service.from('bookings').select('total_price').eq('status', 'completed'),
  ]);

  const totalRevenue = (revenue.data || []).reduce((s, b) => s + Number(b.total_price), 0);
  const platformRevenue = totalRevenue * 0.25;

  return NextResponse.json({
    bookings: {
      total:         bookings.data?.length ?? 0,
      pending_match: bookings.data?.filter(b => b.status === 'pending_match').length ?? 0,
      matched:       bookings.data?.filter(b => b.status === 'matched').length ?? 0,
      completed:     bookings.data?.filter(b => b.status === 'completed').length ?? 0,
      cancelled:     bookings.data?.filter(b => b.status === 'cancelled').length ?? 0,
    },
    cleaners: {
      total:    cleaners.data?.length ?? 0,
      active:   cleaners.data?.filter(c => c.is_active).length ?? 0,
      cleared:  cleaners.data?.filter(c => c.bg_check_status === 'cleared').length ?? 0,
      pending:  cleaners.data?.filter(c => c.bg_check_status === 'pending').length ?? 0,
    },
    applications: {
      total:    applications.data?.length ?? 0,
      pending:  applications.data?.filter(a => a.status === 'pending').length ?? 0,
      approved: applications.data?.filter(a => a.status === 'approved').length ?? 0,
      rejected: applications.data?.filter(a => a.status === 'rejected').length ?? 0,
    },
    revenue: {
      total_gmv:       Math.round(totalRevenue * 100) / 100,
      platform_revenue: Math.round(platformRevenue * 100) / 100,
    },
  });
}
