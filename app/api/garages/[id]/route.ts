import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const g = await prisma.garage.findUnique({
      where: { id: params.id },
      include: { photos: true },
    })
    if (!g) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const stats = await prisma.review.groupBy({
      by: ['garageId'],
      where: { garageId: g.id },
      _avg: { rating: true },
      _count: { rating: true },
    })
    const rating = stats[0]?._avg.rating || 0
    const reviews = stats[0]?._count.rating || 0

    return NextResponse.json({
      garage: {
        ...g,
        rating,
        reviews,
      },
    })
  } catch (e) {
    console.error('GARAGE GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null as any)
    const data: any = {}
    for (const key of [
      'name','description','addressLine1','addressLine2','city','state','postalCode','country','isVerified','status'
    ]) {
      if (body && key in body) data[key] = body[key]
    }
    if (body?.hourlyRate !== undefined) data.hourlyRate = body.hourlyRate != null ? new Prisma.Decimal(body.hourlyRate) : null
    if (body?.dailyRate !== undefined) data.dailyRate = body.dailyRate != null ? new Prisma.Decimal(body.dailyRate) : null
    if (body?.amenities !== undefined) data.amenities = body.amenities

    const updated = await prisma.garage.update({ where: { id: params.id }, data })
    return NextResponse.json({ garage: updated })
  } catch (e) {
    console.error('GARAGE PATCH error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.garage.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('GARAGE DELETE error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
