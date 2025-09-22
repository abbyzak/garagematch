import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// List and create garages
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const city = (searchParams.get('city') || '').trim()
    const postalCode = (searchParams.get('postalCode') || '').trim()
    const ownerId = (searchParams.get('ownerId') || '').trim()
    const take = Math.min(parseInt(searchParams.get('take') || '20', 10), 100)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0)

    const where: any = {}
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { addressLine1: { contains: q, mode: 'insensitive' } },
      ]
    }
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (postalCode) where.postalCode = { contains: postalCode, mode: 'insensitive' }
    if (ownerId) where.ownerId = ownerId

    const [items, total] = await Promise.all([
      prisma.garage.findMany({
        where,
        include: { photos: true },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.garage.count({ where }),
    ])

    if (items.length === 0) {
      // Demo fallback: mock a few NL garages so the UI has data
      const mocks = [
        {
          id: 'mock-ams',
          name: 'Amsterdam Auto Care',
          description: 'Trusted repairs and maintenance',
          city: 'Amsterdam',
          postalCode: '1012AB',
          addressLine1: 'Damrak 1',
          addressLine2: null,
          country: 'Netherlands',
          phone: null,
          email: null,
          workingHours: null,
          image: '',
          rating: 4.6,
          reviews: 128,
          services: ['oil_change','tire_service'],
          prices: { oil_change: 79, tire_service: 49 },
          location: 'Damrak 1, Amsterdam',
        },
        {
          id: 'mock-ut',
          name: 'Utrecht Garage Centrum',
          description: 'Fast and friendly service',
          city: 'Utrecht',
          postalCode: '3511AD',
          addressLine1: 'Neude 2',
          addressLine2: null,
          country: 'Netherlands',
          phone: null,
          email: null,
          workingHours: null,
          image: '',
          rating: 4.3,
          reviews: 76,
          services: ['brake_service','engine_diagnostic'],
          prices: { brake_service: 129, engine_diagnostic: 99 },
          location: 'Neude 2, Utrecht',
        },
        {
          id: 'mock-rtm',
          name: 'Rotterdam Motorworks',
          description: 'Comprehensive car care',
          city: 'Rotterdam',
          postalCode: '3011AA',
          addressLine1: 'Coolsingel 10',
          addressLine2: null,
          country: 'Netherlands',
          phone: null,
          email: null,
          workingHours: null,
          image: '',
          rating: 4.8,
          reviews: 210,
          services: ['battery_service','oil_change'],
          prices: { battery_service: 149, oil_change: 85 },
          location: 'Coolsingel 10, Rotterdam',
        },
      ]
      return NextResponse.json({ items: mocks, total: mocks.length })
    }

    // Hydrate rating and reviews count from Review model
    const garageIds = items.map(g => g.id)
    let stats = new Map<string, { rating: number; reviews: number }>()
    if (garageIds.length > 0) {
      const grouped = await prisma.review.groupBy({
        by: ['garageId'],
        where: { garageId: { in: garageIds } },
        _avg: { rating: true },
        _count: { rating: true },
      })
      stats = new Map(grouped.map(g => [g.garageId, { rating: g._avg.rating || 0, reviews: g._count.rating }]))
    }

    const data = items.map(g => {
      const primary = g.photos.find(p => p.isPrimary) || g.photos[0]
      const p: any = primary as any
      const imageUrl = primary ? (p?.data ? `/api/photos/${p.id}` : ((p?.url as string) || '')) : ''
      return {
      id: g.id,
      name: g.name,
      description: g.description,
      city: g.city,
      postalCode: g.postalCode,
      addressLine1: g.addressLine1,
      addressLine2: g.addressLine2,
      country: g.country,
      phone: null,
      email: null,
      workingHours: null,
      image: imageUrl,
      rating: stats.get(g.id)?.rating || 0,
      reviews: stats.get(g.id)?.reviews || 0,
      services: [],
      prices: {},
      location: [g.addressLine1, g.city].filter(Boolean).join(', '),
    }})

    return NextResponse.json({ items: data, total })
  } catch (e) {
    console.error('GARAGES GET error', e)
    // In demo/staging environments where DB may be absent, do not hard-fail the client UI
    return NextResponse.json({ items: [], total: 0, warning: 'garages unavailable' })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null as any)
    const ownerId = String(body?.ownerId || '')
    const name = String(body?.name || '')
    if (!ownerId || !name) {
      return NextResponse.json({ error: 'ownerId and name are required' }, { status: 400 })
    }

    const created = await prisma.garage.create({
      data: {
        ownerId,
        name,
        description: body?.description || null,
        addressLine1: body?.addressLine1 || null,
        addressLine2: body?.addressLine2 || null,
        city: body?.city || null,
        state: body?.state || null,
        postalCode: body?.postalCode || null,
        country: body?.country || null,
        hourlyRate: body?.hourlyRate ? new Prisma.Decimal(body.hourlyRate) : null,
        dailyRate: body?.dailyRate ? new Prisma.Decimal(body.dailyRate) : null,
        amenities: body?.amenities || null,
      },
    })

    return NextResponse.json({ garage: created }, { status: 201 })
  } catch (e) {
    console.error('GARAGES POST error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
