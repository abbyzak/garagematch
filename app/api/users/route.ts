import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'

// List users (basic) and create user (admin flow)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    const take = Math.min(parseInt(searchParams.get('take') || '20', 10), 100)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0)

    const where: any = q
      ? {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
          ],
        }
      : {}

    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take, skip }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({ items: items.map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, phone: u.phone })), total })
  } catch (e) {
    console.error('USERS GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null as any)
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const name = String(body?.name || '')
    const roleStr = String(body?.role || 'client').trim().toLowerCase()
    if (!email || !password || !name) return NextResponse.json({ error: 'email, password, name required' }, { status: 400 })
    const exist = await prisma.user.findUnique({ where: { email } })
    if (exist) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    const role: Role = roleStr === 'admin' ? Role.ADMIN : roleStr === 'garage_owner' ? Role.GARAGE_OWNER : Role.CLIENT
    const created = await prisma.user.create({ data: { email, password, name, role } })
    return NextResponse.json({ user: { id: created.id, email: created.email, name: created.name, role: created.role, phone: created.phone } }, { status: 201 })
  } catch (e) {
    console.error('USERS POST error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
