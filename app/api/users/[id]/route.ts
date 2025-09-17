import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({ where: { id: params.id } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone } })
  } catch (e) {
    console.error('USER GET error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json().catch(() => null as any)
    const data: any = {}
    if (body?.email) data.email = String(body.email).toLowerCase().trim()
    if (body?.name) data.name = String(body.name)
    if (body?.phone !== undefined) data.phone = body.phone ? String(body.phone) : null
    if (body?.password) data.password = String(body.password)
    if (body?.role) data.role = body.role

    const updated = await prisma.user.update({ where: { id: params.id }, data })
    return NextResponse.json({ user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role, phone: updated.phone } })
  } catch (e) {
    console.error('USER PATCH error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('USER DELETE error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
