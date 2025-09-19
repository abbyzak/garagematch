import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id
  if (!id) return new Response('Not found', { status: 404 })
  const photo = await prisma.garagePhoto.findUnique({ where: { id } })
  if (!photo) return new Response('Not found', { status: 404 })
  if (photo.data && photo.mimeType) {
    return new Response(photo.data, {
      status: 200,
      headers: {
        'Content-Type': photo.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }
  // Fallback: redirect to external URL if present
  if (photo.url) {
    return new Response(null, { status: 302, headers: { Location: photo.url } })
  }
  return new Response('No image data', { status: 404 })
}
