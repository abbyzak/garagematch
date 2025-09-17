import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus, Prisma } from '@prisma/client'

// List and create bookings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = (searchParams.get('userId') || '').trim()
    const garageId = (searchParams.get('garageId') || '').trim()
    const where: any = {}
    if (userId) where.userId = userId
    if (garageId) where.garageId = garageId

    const items = await prisma.booking.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: { user: true, garage: true },
    })

    return NextResponse.json({ items })
  } catch (e) {
    console.error('BOOKINGS GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => null as any)
    const garageId = String(b?.garageId || '')
    const userId = String(b?.userId || '')
    const startTime = b?.startTime ? new Date(b.startTime) : null
    const endTime = b?.endTime ? new Date(b.endTime) : null
    const totalPrice = b?.totalPrice != null ? new Prisma.Decimal(b.totalPrice) : null

    if (!garageId || !userId || !startTime || !endTime) {
      return NextResponse.json({ error: 'garageId, userId, startTime, endTime required' }, { status: 400 })
    }

    const created = await prisma.booking.create({
      data: {
        garageId,
        userId,
        startTime,
        endTime,
        status: BookingStatus.PENDING,
        totalPrice,
        notes: b?.notes || null,
      },
    })

    return NextResponse.json({ booking: created }, { status: 201 })
  } catch (e) {
    console.error('BOOKINGS POST error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
