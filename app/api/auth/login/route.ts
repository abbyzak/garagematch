import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null as any)
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role === Role.ADMIN ? 'admin' : user.role === Role.GARAGE_OWNER ? 'garage_owner' : 'client',
        phone: user.phone || undefined,
      }
    })
  } catch (e) {
    console.error('Login error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
