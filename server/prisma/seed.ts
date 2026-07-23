import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const business = await prisma.business.upsert({
    where: { id: 'seed-business-lakis-coffee' },
    update: {},
    create: {
      id: 'seed-business-lakis-coffee',
      name: 'Lakis Coffee',
      category: 'Kafe',
      address: 'Bağdat Cd. No:123, Kadıköy, İstanbul',
      phone: '+905551234567',
      email: 'info@lakiscoffee.com',
      workingHours: {
        mon: '08:00-22:00',
        tue: '08:00-22:00',
        wed: '08:00-22:00',
        thu: '08:00-22:00',
        fri: '08:00-23:00',
        sat: '09:00-23:00',
        sun: '09:00-22:00',
      },
      loyaltyTargetCups: 6,
    },
  });

  const hotEspresso = await prisma.category.upsert({
    where: { id: 'seed-cat-hot-espresso' },
    update: {},
    create: {
      id: 'seed-cat-hot-espresso',
      businessId: business.id,
      name: 'Espresso Sıcak',
      sortOrder: 1,
    },
  });

  const otherHot = await prisma.category.upsert({
    where: { id: 'seed-cat-other-hot' },
    update: {},
    create: {
      id: 'seed-cat-other-hot',
      businessId: business.id,
      name: 'Diğer Sıcaklar',
      sortOrder: 2,
    },
  });

  await prisma.product.upsert({
    where: { id: 'seed-prod-latte' },
    update: {},
    create: {
      id: 'seed-prod-latte',
      categoryId: hotEspresso.id,
      businessId: business.id,
      name: 'Latte',
      description: 'Espresso ve buharda ısıtılmış süt',
      pointsReward: 1,
      price: 95,
    },
  });

  await prisma.product.upsert({
    where: { id: 'seed-prod-filtre' },
    update: {},
    create: {
      id: 'seed-prod-filtre',
      categoryId: otherHot.id,
      businessId: business.id,
      name: 'Filtre Kahve',
      description: 'Günün filtre kahvesi',
      pointsReward: 1,
      price: 75,
    },
  });

  await prisma.branch.upsert({
    where: { id: 'seed-branch-kadikoy' },
    update: {},
    create: {
      id: 'seed-branch-kadikoy',
      businessId: business.id,
      name: 'Kadıköy Şubesi',
      address: 'Bağdat Cd. No:123, Kadıköy, İstanbul',
      phone: '+905551234567',
      workingHours: { mon: '08:00-22:00' },
    },
  });

  console.log('Seed tamamlandı:', business.name);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
