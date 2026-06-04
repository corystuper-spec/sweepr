import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { quote } from '@/lib/pricing';

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const {
    property,
    pickedAddonIds = [],
    recurrence = 'once',
    date,
    time,
    preferredCleanerId,
    paymentMethodId,
    guestEmail,
    guestName,
    stripeCustomerId,
  } = await request.json();

  if (!property?.address || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const service = createServiceClient();
  let customerId;

  if (user) {
    customerId = user.id;
  } else if (guestEmail) {
    // Create user account for guest (they can set a password later)
    const { data: created, error: createErr } = await service.auth.admin.createUser({
      email: guestEmail,
      email_confirm: true,
      user_metadata: { full_name: guestName || '' },
    });

    if (!createErr) {
      customerId = created.user.id;
    } else {
      // User already exists — get their ID via magic link generation
      const { data: linkData } = await service.auth.admin.generateLink({
        type: 'magiclink',
        email: guestEmail,
      });
      customerId = linkData?.user?.id;
    }

    if (!customerId) {
      return NextResponse.json({ error: 'Failed to create guest account' }, { status: 500 });
    }

    // Ensure profile row exists, save Stripe customer ID if present
    await service.from('profiles').upsert(
      { id: customerId, ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}) },
      { onConflict: 'id' }
    );
  } else {
    return NextResponse.json({ error: 'Authentication or email required' }, { status: 401 });
  }

  const priceQuote = quote({ property, pickedAddonIds, recurrence });

  const { data: prop, error: propErr } = await service
    .from('properties')
    .insert({
      customer_id:   customerId,
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
      customer_id:           customerId,
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

  // Fan out job offers to active, cleared cleaners
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
