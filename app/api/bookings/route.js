import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { quote } from '@/lib/pricing';

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const {
    property,
    pickedAddonIds = [],
    recurrence = 'once',
    date,
    time,
    preferredCleanerId,
    paymentMethodId,   // Stripe PaymentMethod ID (saved at booking time)
  } = await request.json();

  if (!property?.address || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const priceQuote = quote({ property, pickedAddonIds, recurrence });
  const service = createServiceClient();

  // Upsert property (reuse if same address for this customer)
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
      payment_method_id:     paymentMethodId    ?? null,
      payment_status:        paymentMethodId ? 'authorized' : 'pending',
    })
    .select()
    .single();

  if (bookingErr) {
    console.error('Booking insert error:', bookingErr);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }

  // Fan out job offers to active, cleared cleaners in the property zip (or all if no zip match)
  const { data: cleaners } = await service
    .from('cleaners')
    .select('id')
    .eq('is_active', true)
    .eq('bg_check_status', 'cleared');

  if (cleaners?.length) {
    await service.from('job_offers').insert(
      cleaners.map(c => ({ booking_id: booking.id, cleaner_id: c.id, status: 'sent' }))
    );
  }

  return NextResponse.json({ booking, quote: priceQuote }, { status: 201 });
}
