import { NextRequest, NextResponse } from 'next/server'

// Simple proxy to Nominatim to avoid CORS and centralize configuration
// Usage: /api/geocode?q=<query>
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    if (!q) return NextResponse.json({ error: 'q is required' }, { status: 400 })

    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('q', q)
    url.searchParams.set('limit', '1')
    url.searchParams.set('addressdetails', '0')
    url.searchParams.set('polygon_geojson', '0')
    url.searchParams.set('countrycodes', 'nl') // Netherlands

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'GarageMatch/1.0 (contact@example.com)',
        'Accept': 'application/json',
      },
      // Cache briefly to reduce traffic; safe for demo
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ error: 'Geocode failed' }, { status: 502 })
    }
    const data = await res.json()
    const first = Array.isArray(data) && data.length ? data[0] : null
    if (!first) return NextResponse.json({ result: null })
    const lat = parseFloat(first.lat)
    const lon = parseFloat(first.lon)
    return NextResponse.json({ result: { lat, lon, display_name: first.display_name } })
  } catch (e) {
    console.error('GEOCODE error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
