import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = String(searchParams.get('userId') || '')
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

    const msgs = await prisma.message.findMany({
      where: { OR: [{ fromUserId: userId }, { toUserId: userId }] },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    const map = new Map<string, { peerId: string; lastMessage: any }>()
    for (const m of msgs) {
      const peer = m.fromUserId === userId ? m.toUserId : m.fromUserId
      if (!map.has(peer)) {
        map.set(peer, {
          peerId: peer,
          lastMessage: {
            id: m.id,
            body: m.body,
            createdAt: m.createdAt.getTime(),
            fromUserId: m.fromUserId,
            toUserId: m.toUserId,
          },
        })
      }
    }

    const garages = await prisma.garage.findMany({ where: { ownerId: userId }, select: { id: true, name: true } })
    const garageIds = garages.map(g => g.id)

    const items: any[] = []
    for (const { peerId, lastMessage } of Array.from(map.values())) {
      let latestBooking: any = null
      if (garageIds.length > 0) {
        const bk = await prisma.booking.findFirst({
          where: { userId: peerId, garageId: { in: garageIds } },
          include: { garage: true },
          orderBy: { startTime: 'desc' },
        })
        if (bk) {
          latestBooking = {
            id: bk.id,
            garageName: bk.garage?.name || null,
            startTime: bk.startTime.getTime(),
          }
        }
      }
      items.push({ peerId, lastMessage, latestBooking })
    }

    for (const it of items) {
      const u = await prisma.user.findUnique({ where: { id: it.peerId } })
      it.peer = u ? { id: u.id, name: u.name, email: u.email } : { id: it.peerId }
    }

    return NextResponse.json({ items })
  } catch (e) {
    console.error('CONVERSATIONS GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
