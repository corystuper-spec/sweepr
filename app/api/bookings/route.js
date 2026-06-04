import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { quote } from '@/lib/pricing';

export async function POST(request) {
  // Auth-gate via user's session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { property, pickedAddonIds = [], recurrence = 'once', date, time, preferredCleanerId } =
    await request.json();

  if (!property?.address || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Server-side price — never trust the client
  const priceQuote = quote({ property, pickedAddonIds, recurrence });

  // Use service client for inserts that need to cross RLS boundaries
  const service = createServiceClient();

  // Insert property
  const { data: prop, error: propErr } = await service
    .from('properties')
    .insert({
      customer_id:   user.id,
      address:       property.address,
      sqft:          property.sqft   ?? null,
      beds:          property.beds   ?? null,
      baths:         property.baths  ?? null,
      property_type: property.property_type ?? null,
      raw_lookup:    property.raw    ?? null,
    })
    .select()
    .single();

  if (propErr) {
    console.error('Property insert error:', propErr);
    return NextResponse.json({ error: 'Failed to save property' }, { status: 500 });
  }

  // Insert booking
  const { data: booking, error: bookingErr } = await service
    .from('bookings')
    .insert({
      customer_id:           user.id,
      property_id:           prop.id,
      status:                'pending_match',
      base_price:            priceQuote.base_price,
      addons:                priceQuote.addons,
      addons_total:          priceQuote.addons_total,
      recurrence,
      total_price:           priceQuote.total_price,
      scheduled_date:        date,
      scheduled_time:        time,
      preferred_cleaner_id:  preferredCleanerId ?? null,
    })
    .select()
    .single();

  if (bookingErr) {
    console.error('Booking insert error:', bookingErr);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }

  // Fan out job offers to active, cleared cleaners
  let cleanerQuery = service
    .from('cleaners')
    .select('id')
    .eq('is_active', true)
    .eq('bg_check_status', 'cleared');

  if (preferredCleanerId) {
    cleanerQuery = cleanerQuery.eq('id', preferredCleanerId);
  }

  const { data: cleaners } = await cleanerQuery;

  if (cleaners?.length) {
    const offers = cleaners.map(c => ({
      booking_id: booking.id,
      cleaner_id: c.id,
      status:     'sent',
    }));
    await service.from('job_offers').insert(offers);
  }

  return NextResponse.json({ booking, quote: priceQuote }, { status: 201 });
}
