import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request, { params }) {
  const supabase = await createClient();
  const { id: bookingId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const service = createServiceClient();

  const { data: cleaner } = await service
    .from('cleaners')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!cleaner) {
    return NextResponse.json({ error: 'Not a cleaner' }, { status: 403 });
  }

  const { data: booking, error } = await service
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)
    .eq('assigned_cleaner_id', cleaner.id)
    .select()
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: 'Failed to complete booking' }, { status: 500 });
  }

  // Bump jobs_completed on the cleaner row
  await service.rpc('increment_jobs_completed', { cleaner_id: cleaner.id }).maybeSingle();

  return NextResponse.json({ booking });
}
