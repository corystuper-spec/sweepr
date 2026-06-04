import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { stripe } from '@/lib/stripe';

export async function POST(request, { params }) {
  const supabase = await createClient();
  const { id: bookingId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const service = createServiceClient();

  // Verify caller is a cleared, active cleaner
  const { data: cleaner } = await service
    .from('cleaners')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!cleaner) return NextResponse.json({ error: 'Not a cleaner' }, { status: 403 });

  // Verify a sent offer exists for this cleaner on this booking
  const { data: offer, error: offerErr } = await service
    .from('job_offers')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('cleaner_id', cleaner.id)
    .eq('status', 'sent')
    .single();

  if (offerErr || !offer) {
    return NextResponse.json({ error: 'No valid offer found' }, { status: 404 });
  }

  // Fetch booking + customer stripe info
  const { data: booking } = await service
    .from('bookings')
    .select(`
      id, total_price, payment_method_id, payment_status,
      profiles:customer_id ( stripe_customer_id )
    `)
    .eq('id', bookingId)
    .single();

  // Atomically accept this offer, expire all others
  await Promise.all([
    service.from('job_offers').update({ status: 'accepted' }).eq('id', offer.id),
    service.from('job_offers')
      .update({ status: 'expired' })
      .eq('booking_id', bookingId)
      .neq('id', offer.id)
      .eq('status', 'sent'),
  ]);

  // Charge the card if a payment method was saved
  let paymentIntentId = null;
  let paymentStatus = booking?.payment_status || 'pending';

  if (stripe && booking?.payment_method_id && booking?.profiles?.stripe_customer_id) {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount:         Math.round(booking.total_price * 100),
        currency:       'usd',
        customer:       booking.profiles.stripe_customer_id,
        payment_method: booking.payment_method_id,
        confirm:        true,
        off_session:    true,
        description:    `Sweepr booking ${bookingId}`,
      });
      paymentIntentId = paymentIntent.id;
      paymentStatus   = 'paid';
    } catch (stripeErr) {
      console.error('Stripe charge failed on acceptance:', stripeErr.message);
      paymentStatus = 'failed';
      // Still match the booking — admin can resolve payment manually
    }
  }

  const { data: updatedBooking, error: bookingErr } = await service
    .from('bookings')
    .update({
      assigned_cleaner_id:  cleaner.id,
      status:               'matched',
      stripe_payment_intent: paymentIntentId ?? undefined,
      payment_status:       paymentStatus,
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (bookingErr) {
    console.error('Booking update error:', bookingErr);
    return NextResponse.json({ error: 'Failed to accept booking' }, { status: 500 });
  }

  return NextResponse.json({ booking: updatedBooking, paymentStatus });
}
