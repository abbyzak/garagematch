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
    const userId = b?.userId ? String(b.userId) : ''
    const startTime = b?.startTime ? new Date(b.startTime) : null
    const endTime = b?.endTime ? new Date(b.endTime) : null
    const totalPrice = b?.totalPrice != null ? new Prisma.Decimal(b.totalPrice) : null
    const contactEmail = b?.contactEmail ? String(b.contactEmail).trim().toLowerCase() : ''
    const contactPhone = b?.contactPhone ? String(b.contactPhone).trim() : ''
    const otp = b?.otp ? String(b.otp).trim() : ''

    // Validate required timing and target
    if (!garageId || !startTime || !endTime) {
      return NextResponse.json({ error: 'garageId, startTime, endTime required' }, { status: 400 })
    }

    // Two paths:
    // 1) Authenticated: userId present
    // 2) Guest: no userId, must supply contactEmail or contactPhone AND correct OTP (1234)
    let guestData: { contactEmail?: string | null; contactPhone?: string | null } = {}
    let resolvedUserId: string | null = userId || null
    if (!userId) {
      const hasContact = Boolean(contactEmail || contactPhone)
      const otpValid = otp === '1234'
      if (!hasContact) {
        return NextResponse.json({ error: 'For guest booking, contactEmail or contactPhone is required' }, { status: 400 })
      }
      if (!otpValid) {
        return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 })
      }
      guestData = {
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
      }

      // Create or reuse a minimal user for chat capability
      // Prefer email for identification
      const identifierEmail = contactEmail || ''
      try {
        if (identifierEmail) {
          const existing = await prisma.user.findUnique({ where: { email: identifierEmail } })
          if (existing) {
            resolvedUserId = existing.id
          } else {
            const created = await prisma.user.create({
              data: {
                email: identifierEmail,
                password: 'guest',
                name: 'Guest User',
              },
            })
            resolvedUserId = created.id
          }
        } else if (contactPhone) {
          // Fallback: create a synthetic email to satisfy unique constraint
          const synth = `guest+${Date.now()}@example.com`
          const created = await prisma.user.create({
            data: {
              email: synth,
              password: 'guest',
              name: 'Guest User',
            },
          })
          resolvedUserId = created.id
        }
      } catch (e) {
        console.error('Guest user resolve/create failed', e)
      }
    }

    // Lookup garage owner for response convenience
    const garage = await prisma.garage.findUnique({ where: { id: garageId }, select: { ownerId: true } })

    const data: any = {
      garageId,
      startTime,
      endTime,
      status: BookingStatus.PENDING,
      totalPrice,
      notes: b?.notes || null,
      ...guestData,
    }
    if (resolvedUserId) data.userId = resolvedUserId

    const created = await prisma.booking.create({
      data,
    })

    return NextResponse.json({ booking: created, clientUserId: resolvedUserId, garageOwnerId: garage?.ownerId || null }, { status: 201 })
  } catch (e) {
    console.error('BOOKINGS POST error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
