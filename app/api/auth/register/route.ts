import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null as any)
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')
    const name = String(body?.name || '').trim()
    const roleStr = String(body?.role || 'client').trim().toLowerCase()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password and name are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const role: Role = roleStr === 'garage_owner' ? Role.GARAGE_OWNER : roleStr === 'admin' ? Role.ADMIN : Role.CLIENT

    const user = await prisma.user.create({
      data: {
        email,
        password, // NOTE: For production, hash passwords with bcrypt.
        name,
        role,
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: roleStr === 'garage_owner' ? 'garage_owner' : roleStr === 'admin' ? 'admin' : 'client',
        phone: user.phone || undefined,
      }
    }, { status: 201 })
  } catch (e) {
    console.error('Register error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
