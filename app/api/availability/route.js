import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

const TIME_SLOTS = ['8:00 AM', '10:30 AM', '1:00 PM', '3:30 PM'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });

  const service = createServiceClient();

  const [{ count: total }, { data: booked }] = await Promise.all([
    service
      .from('cleaners')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .eq('bg_check_status', 'cleared'),
    service
      .from('bookings')
      .select('scheduled_time')
      .eq('scheduled_date', date)
      .neq('status', 'cancelled'),
  ]);

  const slotCounts = {};
  (booked || []).forEach(b => {
    slotCounts[b.scheduled_time] = (slotCounts[b.scheduled_time] || 0) + 1;
  });

  const totalCleaners = total || 0;
  const availability = TIME_SLOTS.map(slot => {
    const bookedCount = slotCounts[slot] || 0;
    const available   = Math.max(0, totalCleaners - bookedCount);
    return { slot, total: totalCleaners, booked: bookedCount, available, canBook: available > 0 };
  });

  return NextResponse.json({ availability, date });
}
