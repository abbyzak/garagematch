/*
  Seed initial data for GarageMatch
  - Root admin user
  - Demo garage owner with a sample garage
  - Demo client user

  Usage:
    1) Ensure DATABASE_URL is set
    2) npx prisma db push        # create tables (non-destructive)
    3) node prisma/seed.js       # seed data

  Or with package scripts (added in package.json):
    - yarn db:seed
    - yarn db:reset   # drops and recreates tables, then seeds
*/

/* eslint-disable no-console */
const { PrismaClient, Role, GarageStatus } = require('@prisma/client');

const prisma = new PrismaClient();

async function upsertUser({ email, password, name, role, phone }) {
  return prisma.user.upsert({
    where: { email },
    update: { name, password, role, phone },
    create: { email, password, name, role, phone },
  });
}

async function main() {
  const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@garagematch.com';
  const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL || 'owner@garagematch.com';
  const CLIENT_EMAIL = process.env.SEED_CLIENT_EMAIL || 'client@garagematch.com';
  const DEFAULT_PASSWORD = process.env.SEED_PASSWORD || 'password';

  // NOTE: Passwords are plain text to match current login implementation in app/api/auth/login/route.ts
  // For production, switch to hashed passwords and update login accordingly.

  console.log('Seeding users...');
  const admin = await upsertUser({
    email: ADMIN_EMAIL,
    password: DEFAULT_PASSWORD,
    name: 'Root Admin',
    role: Role.ADMIN,
    phone: null,
  });

  const owner = await upsertUser({
    email: OWNER_EMAIL,
    password: DEFAULT_PASSWORD,
    name: 'Demo Garage Owner',
    role: Role.GARAGE_OWNER,
    phone: '+1 555-0101',
  });

  const client = await upsertUser({
    email: CLIENT_EMAIL,
    password: DEFAULT_PASSWORD,
    name: 'Demo Client',
    role: Role.CLIENT,
    phone: '+1 555-0102',
  });

  console.log('Ensuring a demo garage for the owner...');
  const demoGarage = await prisma.garage.upsert({
    where: { id: 'demo-garage-1' },
    update: {
      name: 'Downtown Secure Garage',
      description: 'Well-lit indoor parking with 24/7 access. Fits SUVs and sedans.',
      addressLine1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'USA',
      hourlyRate: 5.0,
      dailyRate: 25.0,
      status: GarageStatus.ACTIVE,
      isVerified: true,
    },
    create: {
      id: 'demo-garage-1',
      ownerId: owner.id,
      name: 'Downtown Secure Garage',
      description: 'Well-lit indoor parking with 24/7 access. Fits SUVs and sedans.',
      addressLine1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'USA',
      hourlyRate: 5.0,
      dailyRate: 25.0,
      status: GarageStatus.ACTIVE,
      isVerified: true,
    },
  });

  await prisma.garagePhoto.upsert({
    where: { id: 'demo-garage-photo-1' },
    update: { url: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80', isPrimary: true },
    create: {
      id: 'demo-garage-photo-1',
      garageId: demoGarage.id,
      url: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=1200&q=80',
      isPrimary: true,
    },
  });

  console.log('Seed complete:');
  console.log({
    admin: { email: admin.email, password: DEFAULT_PASSWORD },
    owner: { email: owner.email, password: DEFAULT_PASSWORD },
    client: { email: client.email, password: DEFAULT_PASSWORD },
    demoGarage: { id: demoGarage.id, name: demoGarage.name, city: demoGarage.city },
  });
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
