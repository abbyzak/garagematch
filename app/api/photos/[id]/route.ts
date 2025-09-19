import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  if (!id) return new Response('Not found', { status: 404 })
  const photo = await prisma.garagePhoto.findUnique({ where: { id } })
  if (!photo) return new Response('Not found', { status: 404 })
  const p: any = photo as any
  if (p.data && p.mimeType) {
    return new Response(p.data as any, {
      status: 200,
      headers: {
        'Content-Type': p.mimeType as string,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }
  // Fallback: redirect to external URL if present
  if (p.url) {
    return new Response(null, { status: 302, headers: { Location: p.url as string } })
  }
  return new Response('No image data', { status: 404 })
}
