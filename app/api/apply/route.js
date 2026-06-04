import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export async function POST(request) {
  const body = await request.json();

  const {
    first_name, last_name, dob, email, phone,
    street, city, state, zip,
    id_type, id_number, ssn, work_authorized,
    experience, service_types, service_zips, bio,
  } = body;

  // Basic server-side validation
  if (!first_name || !last_name || !dob || !email || !phone) {
    return NextResponse.json({ error: 'Missing personal information' }, { status: 400 });
  }
  if (!street || !city || !state || !zip) {
    return NextResponse.json({ error: 'Missing address information' }, { status: 400 });
  }
  if (!id_type || !id_number || !ssn) {
    return NextResponse.json({ error: 'Missing identity information' }, { status: 400 });
  }
  if (!work_authorized) {
    return NextResponse.json({ error: 'Work authorization is required' }, { status: 400 });
  }
  if (!experience || !service_types?.length || !service_zips?.length) {
    return NextResponse.json({ error: 'Missing experience information' }, { status: 400 });
  }

  const service = createServiceClient();

  const { data, error } = await service
    .from('cleaner_applications')
    .insert({
      first_name,
      last_name,
      dob,
      email,
      phone,
      street,
      city,
      state,
      zip,
      id_type,
      id_number,
      ssn_last4: ssn.replace(/\D/g, '').slice(-4), // store only last 4
      work_authorized,
      experience,
      service_types,
      service_zips,
      bio: bio || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Application insert error:', error);
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
  }

  return NextResponse.json({ application: { id: data.id, status: data.status } }, { status: 201 });
}
