import { NextResponse } from 'next/server';

export const revalidate = 86400; // 30-day cache

export async function POST(request) {
  const { address } = await request.json();

  if (!address?.trim()) {
    return NextResponse.json({ error: 'Address is required' }, { status: 400 });
  }

  try {
    const url = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { 'X-Api-Key': process.env.RENTCAST_API_KEY },
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json({ found: false, address, error: 'Lookup failed' }, { status: 200 });
    }

    const data = await res.json();
    const prop = Array.isArray(data) ? data[0] : data;

    if (!prop) {
      return NextResponse.json({ found: false, address });
    }

    return NextResponse.json({
      found: true,
      address:       prop.formattedAddress ?? address,
      sqft:          prop.squareFootage    ?? null,
      beds:          prop.bedrooms         ?? null,
      baths:         prop.bathrooms        ?? null,
      property_type: prop.propertyType     ?? null,
      raw:           prop,
      estimate:      prop.price            ?? null,
    });
  } catch (err) {
    console.error('RentCast lookup error:', err);
    return NextResponse.json({ found: false, address });
  }
}
