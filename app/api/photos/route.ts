import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import sharp from 'sharp'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const garageId = String(form.get('garageId') || '')
    const isPrimary = String(form.get('isPrimary') || 'false') === 'true'
    const file = form.get('file') as File | null

    if (!garageId || !file) {
      return NextResponse.json({ error: 'garageId and file are required' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const input = Buffer.from(arrayBuffer)

    // Compress to webp for good balance
    const image = sharp(input)
    const metadata = await image.metadata()
    const resized = image.resize({ width: 1600, withoutEnlargement: true })
    const webpBuffer = await resized.webp({ quality: 80 }).toBuffer()
    const { width, height, size } = await sharp(webpBuffer).metadata()

    // Store in DB as embedded data
    const created = await prisma.garagePhoto.create({
      data: {
        garageId,
        data: webpBuffer,
        mimeType: 'image/webp',
        width: width || null,
        height: height || null,
        size: size ? Number(size) : webpBuffer.length,
        isPrimary,
      },
    })

    // If setting primary, unset others
    if (isPrimary) {
      await prisma.garagePhoto.updateMany({
        where: { garageId, NOT: { id: created.id } },
        data: { isPrimary: false },
      })
    }

    return NextResponse.json({ photo: { id: created.id, url: `/api/photos/${created.id}` } }, { status: 201 })
  } catch (e) {
    console.error('PHOTO UPLOAD error', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
