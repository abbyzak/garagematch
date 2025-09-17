import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// List favorites for a user, or toggle favorite
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = (searchParams.get('userId') || '').trim()
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const items = await prisma.favorite.findMany({
      where: { userId },
      include: { garage: { include: { photos: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const data = items.map(f => ({
      id: f.id,
      createdAt: f.createdAt,
      garage: {
        id: f.garage.id,
        name: f.garage.name,
        city: f.garage.city,
        postalCode: f.garage.postalCode,
        image: f.garage.photos.find(p => p.isPrimary)?.url || f.garage.photos[0]?.url || '',
      },
    }))

    return NextResponse.json({ items: data })
  } catch (e) {
    console.error('FAVORITES GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null as any)
    const userId = String(b?.userId || '')
    const garageId = String(b?.garageId || '')
    if (!userId || !garageId) return NextResponse.json({ error: 'userId and garageId required' }, { status: 400 })

    // toggle
    const exist = await prisma.favorite.findFirst({ where: { userId, garageId } })
    if (exist) {
      await prisma.favorite.delete({ where: { id: exist.id } })
      return NextResponse.json({ toggled: 'removed' })
    }
    const created = await prisma.favorite.create({ data: { userId, garageId } })
    return NextResponse.json({ toggled: 'added', favorite: created }, { status: 201 })
  } catch (e) {
    console.error('FAVORITES POST error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
