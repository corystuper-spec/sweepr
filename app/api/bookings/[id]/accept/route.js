import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request, { params }) {
  const supabase = await createClient();
  const { id: bookingId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify the caller is a cleaner
  const { data: cleaner } = await supabase
    .from('cleaners')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!cleaner) {
    return NextResponse.json({ error: 'Not a cleaner' }, { status: 403 });
  }

  // Verify there's a sent offer for this cleaner on this booking
  const { data: offer, error: offerErr } = await supabase
    .from('job_offers')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('cleaner_id', cleaner.id)
    .eq('status', 'sent')
    .single();

  if (offerErr || !offer) {
    return NextResponse.json({ error: 'No valid offer found' }, { status: 404 });
  }

  // Atomically: accept this offer, expire all others, update booking
  const [offerUpdate, expireOthers, bookingUpdate] = await Promise.all([
    supabase
      .from('job_offers')
      .update({ status: 'accepted' })
      .eq('id', offer.id),

    supabase
      .from('job_offers')
      .update({ status: 'expired' })
      .eq('booking_id', bookingId)
      .neq('id', offer.id)
      .eq('status', 'sent'),

    supabase
      .from('bookings')
      .update({ assigned_cleaner_id: cleaner.id, status: 'matched' })
      .eq('id', bookingId)
      .select()
      .single(),
  ]);

  if (bookingUpdate.error) {
    console.error('Booking update error:', bookingUpdate.error);
    return NextResponse.json({ error: 'Failed to accept booking' }, { status: 500 });
  }

  return NextResponse.json({ booking: bookingUpdate.data });
}
