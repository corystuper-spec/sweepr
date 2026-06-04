import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { stripe } from '@/lib/stripe';

export async function POST(request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const body = await request.json().catch(() => ({}));
  const { guestEmail } = body;

  const service = createServiceClient();
  let stripeCustomerId = null;

  if (user) {
    const { data: profile } = await service
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_uid: user.id },
      });
      stripeCustomerId = customer.id;
      await service.from('profiles').update({ stripe_customer_id: stripeCustomerId }).eq('id', user.id);
    }
  } else if (guestEmail) {
    const existing = await stripe.customers.list({ email: guestEmail, limit: 1 });
    if (existing.data.length > 0) {
      stripeCustomerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: guestEmail });
      stripeCustomerId = customer.id;
    }
  } else {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    usage: 'off_session',
  });

  return NextResponse.json({
    clientSecret: setupIntent.client_secret,
    stripeCustomerId,
  });
}
