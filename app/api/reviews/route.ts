import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// List and create reviews
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const garageId = (searchParams.get('garageId') || '').trim()
    if (!garageId) return NextResponse.json({ error: 'garageId required' }, { status: 400 })

    const items = await prisma.review.findMany({
      where: { garageId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    })

    const data = items.map(r => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      user: { id: r.user.id, name: r.user.name },
    }))

    return NextResponse.json({ items: data })
  } catch (e) {
    console.error('REVIEWS GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null as any)
    const garageId = String(b?.garageId || '')
    const userId = String(b?.userId || '')
    const rating = Number(b?.rating)
    const comment = b?.comment ? String(b.comment) : null

    if (!garageId || !userId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'garageId, userId and rating (1-5) required' }, { status: 400 })
    }

    const created = await prisma.review.create({ data: { garageId, userId, rating, comment } })
    return NextResponse.json({ review: created }, { status: 201 })
  } catch (e) {
    console.error('REVIEWS POST error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
