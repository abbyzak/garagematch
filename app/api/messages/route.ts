import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Message as PrismaMessage } from '@prisma/client';

// Keep the conversation id helper consistent with previous logic
function makeConversationId(a: string, b: string): string {
  return [a, b].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)).join(':');
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const a = (searchParams.get('a') || '').trim();
  const b = (searchParams.get('b') || '').trim();
  const since = parseInt(searchParams.get('since') || '0', 10);
  if (!a || !b) {
    return NextResponse.json({ error: 'Missing participants a and b' }, { status: 400 });
  }

  const conversationId = makeConversationId(a, b);
  const where: any = { conversationId };
  if (since && Number.isFinite(since) && since > 0) {
    where.createdAt = { gt: new Date(since) };
  }

  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  // Convert Date to epoch ms for backward compatibility in response
  const mapped = messages.map((m: PrismaMessage) => ({
    id: m.id,
    conversationId: m.conversationId,
    fromUserId: m.fromUserId,
    toUserId: m.toUserId,
    body: m.body,
    createdAt: m.createdAt.getTime(),
  }));

  return NextResponse.json({ messages: mapped });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null as any);
  const fromUserId: string = (body?.fromUserId || '').trim();
  const toUserId: string = (body?.toUserId || '').trim();
  const text: string = (body?.body || '').toString();
  if (!fromUserId || !toUserId || !text) {
    return NextResponse.json({ error: 'Missing fromUserId, toUserId or body' }, { status: 400 });
  }

  const created = await prisma.message.create({
    data: {
      conversationId: makeConversationId(fromUserId, toUserId),
      fromUserId,
      toUserId,
      body: text,
      // createdAt defaults to now()
    },
  });

  return NextResponse.json(
    {
      message: {
        id: created.id,
        conversationId: created.conversationId,
        fromUserId: created.fromUserId,
        toUserId: created.toUserId,
        body: created.body,
        createdAt: created.createdAt.getTime(),
      },
    },
    { status: 201 }
  );
}



