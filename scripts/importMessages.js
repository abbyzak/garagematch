/*
  Import legacy messages from data/messages.json into MySQL using Prisma.
  Usage:
    1) Ensure DATABASE_URL is set in .env
    2) npm run prisma:push  (to create tables)
    3) npm run db:import-messages
*/

/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const dataFile = path.join(process.cwd(), 'data', 'messages.json');

function makeConversationId(a, b) {
  return [a, b].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)).join(':');
}

async function readLegacyMessages() {
  try {
    await fs.promises.access(dataFile);
  } catch {
    console.warn('No legacy messages file found at', dataFile);
    return [];
  }
  const raw = await fs.promises.readFile(dataFile, 'utf-8');
  const json = JSON.parse(raw || '{"messages":[]}');
  const arr = Array.isArray(json.messages) ? json.messages : [];
  // Normalize shape
  return arr.map((m) => ({
    id: String(m.id ?? ''),
    conversationId: String(m.conversationId ?? makeConversationId(String(m.fromUserId||''), String(m.toUserId||''))),
    fromUserId: String(m.fromUserId ?? ''),
    toUserId: String(m.toUserId ?? ''),
    body: String(m.body ?? ''),
    createdAt: new Date(typeof m.createdAt === 'number' ? m.createdAt : Date.now()),
  })).filter((m) => m.fromUserId && m.toUserId && m.body);
}

async function main() {
  const messages = await readLegacyMessages();
  if (!messages.length) {
    console.log('Nothing to import. Exiting.');
    return;
  }

  console.log(`Importing ${messages.length} messages...`);

  // Use createMany in batches to speed up import
  const BATCH = 1000;
  let inserted = 0;
  for (let i = 0; i < messages.length; i += BATCH) {
    const slice = messages.slice(i, i + BATCH);
    // createMany can't set createdAt with Date? It can. We'll pass data directly.
    // However, Prisma's createMany ignores default values; that's fine.
    try {
      const result = await prisma.message.createMany({
        data: slice,
        skipDuplicates: true, // skip if id duplicates
      });
      inserted += result.count;
      console.log(`Inserted ${result.count} (total ${inserted})`);
    } catch (e) {
      console.error('Batch insert failed, falling back to individual inserts:', e);
      for (const m of slice) {
        try {
          await prisma.message.create({ data: m });
          inserted += 1;
        } catch (err) {
          // likely duplicate id; try upsert by id
          try {
            await prisma.message.upsert({
              where: { id: m.id },
              update: {},
              create: m,
            });
          } catch (err2) {
            console.error('Failed to insert message id', m.id, err2);
          }
        }
      }
    }
  }

  console.log(`Done. Inserted total ${inserted} messages.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
