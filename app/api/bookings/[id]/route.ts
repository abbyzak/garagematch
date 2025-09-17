import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bk = await prisma.booking.findUnique({ where: { id: params.id }, include: { user: true, garage: true } })
    if (!bk) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ booking: bk })
  } catch (e) {
    console.error('BOOKING GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const b = await req.json().catch(() => null as any)
    const data: any = {}
    if (b?.status && [
      BookingStatus.PENDING,
      BookingStatus.CONFIRMED,
      BookingStatus.CANCELLED,
      BookingStatus.COMPLETED,
    ].includes(b.status)) {
      data.status = b.status
    }
    if (b?.startTime) data.startTime = new Date(b.startTime)
    if (b?.endTime) data.endTime = new Date(b.endTime)
    if (b?.notes !== undefined) data.notes = b.notes ?? null

    const updated = await prisma.booking.update({ where: { id: params.id }, data })
    return NextResponse.json({ booking: updated })
  } catch (e) {
    console.error('BOOKING PATCH error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.booking.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('BOOKING DELETE error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
