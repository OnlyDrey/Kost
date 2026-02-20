import { PrismaClient, DistributionMethod, UserRole, PeriodStatus, IncomeType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash password for test users (password: "password123")
  const passwordHash = await bcrypt.hash('password123', 10);

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceShare.deleteMany();
  await prisma.invoiceDistributionRule.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.income.deleteMany();
  await prisma.period.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.webAuthnCredential.deleteMany();
  await prisma.magicLinkToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.family.deleteMany();

  // Create family
  const family = await prisma.family.create({
    data: {
      name: 'Familien Hansen',
    },
  });

  // Create users
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      name: 'Kari Hansen',
      passwordHash,
      role: UserRole.ADMIN,
      familyId: family.id,
    },
  });

  const adult1 = await prisma.user.create({
    data: {
      username: 'ola',
      name: 'Ola Hansen',
      passwordHash,
      role: UserRole.ADULT,
      familyId: family.id,
    },
  });

  const adult2 = await prisma.user.create({
    data: {
      username: 'lisa',
      name: 'Lisa Hansen',
      passwordHash,
      role: UserRole.ADULT,
      familyId: family.id,
    },
  });

  console.log(`✅ Created family: ${family.name}`);
  console.log(`✅ Created users: ${admin.name}, ${adult1.name}, ${adult2.name}`);

  // Create periods
  const feb2026 = await prisma.period.create({
    data: {
      id: '2026-02',
      familyId: family.id,
      status: PeriodStatus.CLOSED,
      closedAt: new Date('2026-03-01'),
      closedBy: admin.id,
    },
  });

  const mar2026 = await prisma.period.create({
    data: {
      id: '2026-03',
      familyId: family.id,
      status: PeriodStatus.OPEN,
    },
  });

  console.log(`✅ Created periods: ${feb2026.id}, ${mar2026.id}`);

  // Create incomes for February
  await prisma.income.create({
    data: {
      userId: admin.id,
      periodId: feb2026.id,
      inputType: IncomeType.MONTHLY_GROSS,
      inputCents: 5500000, // 55,000 NOK
      normalizedMonthlyGrossCents: 5500000,
    },
  });

  await prisma.income.create({
    data: {
      userId: adult1.id,
      periodId: feb2026.id,
      inputType: IncomeType.MONTHLY_GROSS,
      inputCents: 4500000, // 45,000 NOK
      normalizedMonthlyGrossCents: 4500000,
    },
  });

  await prisma.income.create({
    data: {
      userId: adult2.id,
      periodId: feb2026.id,
      inputType: IncomeType.ANNUAL_GROSS,
      inputCents: 48000000, // 480,000 NOK annual
      normalizedMonthlyGrossCents: 4000000, // 40,000 NOK monthly
    },
  });

  // Create incomes for March
  await prisma.income.create({
    data: {
      userId: admin.id,
      periodId: mar2026.id,
      inputType: IncomeType.MONTHLY_GROSS,
      inputCents: 5500000,
      normalizedMonthlyGrossCents: 5500000,
    },
  });

  await prisma.income.create({
    data: {
      userId: adult1.id,
      periodId: mar2026.id,
      inputType: IncomeType.MONTHLY_GROSS,
      inputCents: 4500000,
      normalizedMonthlyGrossCents: 4500000,
    },
  });

  await prisma.income.create({
    data: {
      userId: adult2.id,
      periodId: mar2026.id,
      inputType: IncomeType.MONTHLY_GROSS,
      inputCents: 4000000,
      normalizedMonthlyGrossCents: 4000000,
    },
  });

  console.log(`✅ Created incomes for both periods`);

  // Invoice 1: BY_PERCENT (50/30/20 split) - Electricity
  const invoice1 = await prisma.invoice.create({
    data: {
      familyId: family.id,
      periodId: mar2026.id,
      category: 'Utilities',
      vendor: 'Strøm AS',
      description: 'Strømregning mars 2026',
      totalCents: 245000, // 2,450 NOK
      distributionMethod: DistributionMethod.BY_PERCENT,
      distribution: {
        create: {
          method: DistributionMethod.BY_PERCENT,
          percentRules: [
            { userId: admin.id, percentBasisPoints: 5000 }, // 50%
            { userId: adult1.id, percentBasisPoints: 3000 }, // 30%
            { userId: adult2.id, percentBasisPoints: 2000 }, // 20%
          ],
        },
      },
    },
  });

  // Calculate shares for invoice 1
  await prisma.invoiceShare.createMany({
    data: [
      {
        invoiceId: invoice1.id,
        userId: admin.id,
        shareCents: 122500, // 50% = 1,225 NOK
        explanation: 'Your share is 1,225.00 kr (50.00% of 2,450.00 kr)',
      },
      {
        invoiceId: invoice1.id,
        userId: adult1.id,
        shareCents: 73500, // 30% = 735 NOK
        explanation: 'Your share is 735.00 kr (30.00% of 2,450.00 kr)',
      },
      {
        invoiceId: invoice1.id,
        userId: adult2.id,
        shareCents: 49000, // 20% = 490 NOK
        explanation: 'Your share is 490.00 kr (20.00% of 2,450.00 kr)',
      },
    ],
  });

  // Payment for invoice 1
  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      paidById: admin.id,
      amountCents: 245000,
      paidAt: new Date('2026-03-05'),
    },
  });

  console.log(`✅ Created invoice 1: Strøm AS (BY_PERCENT)`);

  // Invoice 2: BY_INCOME - Internet
  const invoice2 = await prisma.invoice.create({
    data: {
      familyId: family.id,
      periodId: mar2026.id,
      category: 'Utilities',
      vendor: 'Internettleverandør',
      description: 'Internett mars 2026',
      totalCents: 69900, // 699 NOK
      distributionMethod: DistributionMethod.BY_INCOME,
      distribution: {
        create: {
          method: DistributionMethod.BY_INCOME,
        },
      },
    },
  });

  // Total income: 55k + 45k + 40k = 140k
  // Kari: 55k/140k = 39.29%, Ola: 45k/140k = 32.14%, Lisa: 40k/140k = 28.57%
  await prisma.invoiceShare.createMany({
    data: [
      {
        invoiceId: invoice2.id,
        userId: admin.id,
        shareCents: 27464, // 39.29% ≈ 274.64 kr
        explanation: 'Your share is 274.64 kr (39.29% based on income of 55,000.00 kr / 140,000.00 kr total)',
      },
      {
        invoiceId: invoice2.id,
        userId: adult1.id,
        shareCents: 22464, // 32.14% ≈ 224.64 kr
        explanation: 'Your share is 224.64 kr (32.14% based on income of 45,000.00 kr / 140,000.00 kr total)',
      },
      {
        invoiceId: invoice2.id,
        userId: adult2.id,
        shareCents: 19972, // 28.57% ≈ 199.72 kr (adjusted to sum to total)
        explanation: 'Your share is 199.72 kr (28.57% based on income of 40,000.00 kr / 140,000.00 kr total)',
      },
    ],
  });

  // Partial payment
  await prisma.payment.create({
    data: {
      invoiceId: invoice2.id,
      paidById: adult1.id,
      amountCents: 50000,
      paidAt: new Date('2026-03-10'),
    },
  });

  console.log(`✅ Created invoice 2: Internettleverandør (BY_INCOME)`);

  // Invoice 3: FIXED with remainder - Grocery shopping
  const invoice3 = await prisma.invoice.create({
    data: {
      familyId: family.id,
      periodId: mar2026.id,
      category: 'Food',
      vendor: 'REMA 1000',
      description: 'Storhandel',
      totalCents: 350000, // 3,500 NOK
      distributionMethod: DistributionMethod.FIXED,
      distribution: {
        create: {
          method: DistributionMethod.FIXED,
          fixedRules: [
            { userId: admin.id, fixedCents: 100000 }, // 1,000 NOK fixed
            { userId: adult1.id, fixedCents: 50000 },  // 500 NOK fixed
          ],
          remainderMethod: 'BY_INCOME',
        },
      },
      lines: {
        create: [
          { description: 'Frukt og grønnsaker', amountCents: 120000 },
          { description: 'Kjøtt og fisk', amountCents: 150000 },
          { description: 'Meieri', amountCents: 80000 },
        ],
      },
    },
  });

  // Fixed: Kari 1000, Ola 500, total fixed = 1500
  // Remainder: 3500 - 1500 = 2000
  // BY_INCOME on 2000: Kari 39.29% = 785.80, Ola 32.14% = 642.80, Lisa 28.57% = 571.40
  // Final: Kari = 1000 + 785.80 = 1785.80, Ola = 500 + 642.80 = 1142.80, Lisa = 571.40
  await prisma.invoiceShare.createMany({
    data: [
      {
        invoiceId: invoice3.id,
        userId: admin.id,
        shareCents: 178579,
        explanation: 'Your share is 1,785.79 kr (1,000.00 kr fixed + 785.79 kr from remainder based on income)',
      },
      {
        invoiceId: invoice3.id,
        userId: adult1.id,
        shareCents: 114279,
        explanation: 'Your share is 1,142.79 kr (500.00 kr fixed + 642.79 kr from remainder based on income)',
      },
      {
        invoiceId: invoice3.id,
        userId: adult2.id,
        shareCents: 57142,
        explanation: 'Your share is 571.42 kr (remainder based on income, no fixed amount)',
      },
    ],
  });

  console.log(`✅ Created invoice 3: REMA 1000 (FIXED + remainder BY_INCOME)`);

  // Subscription
  await prisma.subscription.create({
    data: {
      familyId: family.id,
      name: 'Netflix',
      vendor: 'Netflix',
      category: 'Entertainment',
      amountCents: 17900, // 179 NOK
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      startDate: new Date('2026-01-01'),
      distributionMethod: DistributionMethod.BY_PERCENT,
      distributionRules: [
        { userId: admin.id, percentBasisPoints: 3333 },
        { userId: adult1.id, percentBasisPoints: 3333 },
        { userId: adult2.id, percentBasisPoints: 3334 },
      ],
      lastGenerated: new Date('2026-03-01'),
    },
  });

  console.log(`✅ Created subscription: Netflix`);

  // Audit logs
  await prisma.auditLog.create({
    data: {
      familyId: family.id,
      userId: admin.id,
      action: 'PERIOD_CLOSE',
      entityType: 'Period',
      entityId: feb2026.id,
      metadata: {
        closedAt: feb2026.closedAt,
        finalBalances: {
          [admin.id]: { netCents: -15000 },
          [adult1.id]: { netCents: 8000 },
          [adult2.id]: { netCents: 7000 },
        },
      },
    },
  });

  console.log(`✅ Created audit log for period closure`);

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Family: ${family.name}`);
  console.log(`   - Users: 3 (1 Admin, 2 Adults) - password: "password123"`);
  console.log(`   - Periods: 2 (Feb closed, Mar open)`);
  console.log(`   - Invoices: 3 (various distribution methods)`);
  console.log(`   - Payments: 2 (1 full, 1 partial)`);
  console.log(`   - Subscription: 1`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
