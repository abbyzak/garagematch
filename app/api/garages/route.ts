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

    // Hydrate rating and reviews count from Review model
    const garageIds = items.map(g => g.id)
    const grouped = await prisma.review.groupBy({
      by: ['garageId'],
      where: { garageId: { in: garageIds } },
      _avg: { rating: true },
      _count: { rating: true },
    })
    const stats = new Map(grouped.map(g => [g.garageId, { rating: g._avg.rating || 0, reviews: g._count.rating }]))

    const data = items.map(g => ({
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
      image: g.photos.find(p => p.isPrimary)?.url || g.photos[0]?.url || '',
      rating: stats.get(g.id)?.rating || 0,
      reviews: stats.get(g.id)?.reviews || 0,
      services: [],
      prices: {},
      location: [g.addressLine1, g.city].filter(Boolean).join(', '),
    }))

    return NextResponse.json({ items: data, total })
  } catch (e) {
    console.error('GARAGES GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
