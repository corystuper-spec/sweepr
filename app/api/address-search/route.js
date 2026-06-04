import { NextResponse } from 'next/server';

function formatAddress(addr) {
  const num    = addr.house_number || '';
  const road   = addr.road || addr.pedestrian || '';
  const street = [num, road].filter(Boolean).join(' ');
  const city   = addr.city || addr.town || addr.village || addr.municipality || '';
  const state  = addr.state || '';
  const zip    = addr.postcode || '';
  return [street, city, state, zip].filter(Boolean).join(', ');
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 3) return NextResponse.json({ results: [] });

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('limit', '5');
    url.searchParams.set('countrycodes', 'us');
    url.searchParams.set('featuretype', 'house');

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Sweepr/1.0 (sweepr-app)',
        'Accept-Language': 'en',
      },
      next: { revalidate: 60 },
    });

    if (!res.ok) return NextResponse.json({ results: [] });

    const data = await res.json();

    const results = data
      .filter(item => item.address?.country_code === 'us')
      .map(item => ({
        address: formatAddress(item.address),
        display: item.display_name,
        lat: item.lat,
        lon: item.lon,
      }))
      .filter(r => r.address.length > 4);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
