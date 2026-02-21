import { PrismaClient, DistributionMethod, UserRole, IncomeType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('kostpass', 10);

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
  await (prisma as any).vendor.deleteMany();
  await prisma.family.deleteMany();

  // Create family (required as parent for all records)
  const family = await prisma.family.create({
    data: {
      name: 'Familien',
      categories: ['Bolig', 'Forsikring', 'Bil', 'Dagligvarer', 'Abonnement', 'Annet'],
      paymentMethods: ['Felles konto', 'AvtaleGiro', 'Faktura'],
      currency: 'NOK',
    } as any,
  });

  // Create users
  const andreas = await prisma.user.create({
    data: {
      username: 'andreas',
      name: 'Andreas',
      passwordHash,
      role: UserRole.ADMIN,
      familyId: family.id,
    },
  });

  const marta = await prisma.user.create({
    data: {
      username: 'marta',
      name: 'Marta',
      passwordHash,
      role: UserRole.ADULT,
      familyId: family.id,
    },
  });

  console.log(`Created users: ${andreas.name}, ${marta.name} (password: kostpass)`);

  // Create vendors
  const vendorNames = [
    { name: 'Sparebank 1', logoUrl: 'https://logo.clearbit.com/sparebank1.no' },
    { name: 'Porsgrunn Kommune' },
    { name: 'Vibb', logoUrl: 'https://logo.clearbit.com/vibb.no' },
    { name: 'Telenor', logoUrl: 'https://logo.clearbit.com/telenor.no' },
    { name: 'Fremtind Forsikring', logoUrl: 'https://logo.clearbit.com/fremtind.no' },
    { name: 'Storebrand Forsikring', logoUrl: 'https://logo.clearbit.com/storebrand.no' },
    { name: 'Tryg Forsikring', logoUrl: 'https://logo.clearbit.com/tryg.no' },
    { name: 'Nordea Liv', logoUrl: 'https://logo.clearbit.com/nordea.no' },
    { name: 'Sparebank 1 Sør-Norge', logoUrl: 'https://logo.clearbit.com/sparebank1.no' },
  ];
  for (const v of vendorNames) {
    await (prisma as any).vendor.create({ data: { familyId: family.id, ...v } });
  }

  // Create current period: February 2026 (open)
  const period = await prisma.period.create({
    data: {
      id: '2026-02',
      familyId: family.id,
    },
  });

  console.log(`Created period: ${period.id}`);

  // Incomes
  // Andreas: 65 000 kr/month → 57.02% of total
  // Marta:   49 000 kr/month → 42.98% of total
  const andreasIncome = 6500000; // 65 000 kr in cents
  const martaIncome   = 4900000; // 49 000 kr in cents

  await prisma.income.create({
    data: {
      userId: andreas.id,
      periodId: period.id,
      inputType: IncomeType.MONTHLY_GROSS,
      inputCents: andreasIncome,
      normalizedMonthlyGrossCents: andreasIncome,
    },
  });

  await prisma.income.create({
    data: {
      userId: marta.id,
      periodId: period.id,
      inputType: IncomeType.MONTHLY_GROSS,
      inputCents: martaIncome,
      normalizedMonthlyGrossCents: martaIncome,
    },
  });

  console.log('Created incomes');

  // Helper: BY_INCOME shares (57.02% / 42.98%)
  const total = andreasIncome + martaIncome; // 114 000 kr
  const byIncome = (totalCents: number) => {
    const a = Math.round(totalCents * andreasIncome / total);
    const m = totalCents - a;
    return { andreas: a, marta: m };
  };

  // ─── BOLIG ────────────────────────────────────────────────────────────────

  // LOfavør Boliglån – 19 198 kr – BY_INCOME – Sparebank 1
  const inv1 = await prisma.invoice.create({
    data: {
      familyId: family.id, periodId: period.id,
      category: 'Bolig', vendor: 'Sparebank 1',
      description: 'LOfavør Boliglån',
      totalCents: 1919800, distributionMethod: DistributionMethod.BY_INCOME,
      paymentMethod: 'AvtaleGiro',
    },
  });
  const s1 = byIncome(inv1.totalCents);
  await prisma.invoiceShare.createMany({ data: [
    { invoiceId: inv1.id, userId: andreas.id, shareCents: s1.andreas, explanation: `Inntektsbasert andel: ${(andreasIncome/total*100).toFixed(2)}%` },
    { invoiceId: inv1.id, userId: marta.id,   shareCents: s1.marta,   explanation: `Inntektsbasert andel: ${(martaIncome/total*100).toFixed(2)}%` },
  ]});

  // Porsgrunn Kommune – 1 972 kr – BY_INCOME
  const inv2 = await prisma.invoice.create({
    data: {
      familyId: family.id, periodId: period.id,
      category: 'Bolig', vendor: 'Porsgrunn Kommune',
      description: 'Kommunale avgifter',
      totalCents: 197200, distributionMethod: DistributionMethod.BY_INCOME,
      paymentMethod: 'Faktura',
    },
  });
  const s2 = byIncome(inv2.totalCents);
  await prisma.invoiceShare.createMany({ data: [
    { invoiceId: inv2.id, userId: andreas.id, shareCents: s2.andreas, explanation: `Inntektsbasert andel: ${(andreasIncome/total*100).toFixed(2)}%` },
    { invoiceId: inv2.id, userId: marta.id,   shareCents: s2.marta,   explanation: `Inntektsbasert andel: ${(martaIncome/total*100).toFixed(2)}%` },
  ]});

  // Strøm & Nettleie – 4 377,53 kr – BY_INCOME – Vibb
  const inv3 = await prisma.invoice.create({
    data: {
      familyId: family.id, periodId: period.id,
      category: 'Bolig', vendor: 'Vibb',
      description: 'Strøm & Nettleie',
      totalCents: 437753, distributionMethod: DistributionMethod.BY_INCOME,
      paymentMethod: 'AvtaleGiro',
    },
  });
  const s3 = byIncome(inv3.totalCents);
  await prisma.invoiceShare.createMany({ data: [
    { invoiceId: inv3.id, userId: andreas.id, shareCents: s3.andreas, explanation: `Inntektsbasert andel: ${(andreasIncome/total*100).toFixed(2)}%` },
    { invoiceId: inv3.id, userId: marta.id,   shareCents: s3.marta,   explanation: `Inntektsbasert andel: ${(martaIncome/total*100).toFixed(2)}%` },
  ]});

  // Internett & TV – 899 kr – BY_INCOME – Telenor
  const inv4 = await prisma.invoice.create({
    data: {
      familyId: family.id, periodId: period.id,
      category: 'Bolig', vendor: 'Telenor',
      description: 'Internett & TV',
      totalCents: 89900, distributionMethod: DistributionMethod.BY_INCOME,
      paymentMethod: 'AvtaleGiro',
    },
  });
  const s4 = byIncome(inv4.totalCents);
  await prisma.invoiceShare.createMany({ data: [
    { invoiceId: inv4.id, userId: andreas.id, shareCents: s4.andreas, explanation: `Inntektsbasert andel: ${(andreasIncome/total*100).toFixed(2)}%` },
    { invoiceId: inv4.id, userId: marta.id,   shareCents: s4.marta,   explanation: `Inntektsbasert andel: ${(martaIncome/total*100).toFixed(2)}%` },
  ]});

  // ─── FORSIKRING ───────────────────────────────────────────────────────────

  // Fremtind Forsikring – 2 962 kr – BY_INCOME
  const inv5 = await prisma.invoice.create({
    data: {
      familyId: family.id, periodId: period.id,
      category: 'Forsikring', vendor: 'Fremtind Forsikring',
      description: 'Innboforsikring',
      totalCents: 296200, distributionMethod: DistributionMethod.BY_INCOME,
      paymentMethod: 'AvtaleGiro',
    },
  });
  const s5 = byIncome(inv5.totalCents);
  await prisma.invoiceShare.createMany({ data: [
    { invoiceId: inv5.id, userId: andreas.id, shareCents: s5.andreas, explanation: `Inntektsbasert andel: ${(andreasIncome/total*100).toFixed(2)}%` },
    { invoiceId: inv5.id, userId: marta.id,   shareCents: s5.marta,   explanation: `Inntektsbasert andel: ${(martaIncome/total*100).toFixed(2)}%` },
  ]});

  // Ulykkesforsikring – 90 kr – FIXED equal (50/50) – Storebrand
  const inv6 = await prisma.invoice.create({
    data: {
      familyId: family.id, periodId: period.id,
      category: 'Forsikring', vendor: 'Storebrand Forsikring',
      description: 'Ulykkesforsikring',
      totalCents: 9000, distributionMethod: DistributionMethod.FIXED,
      paymentMethod: 'AvtaleGiro',
    },
  });
  await prisma.invoiceShare.createMany({ data: [
    { invoiceId: inv6.id, userId: andreas.id, shareCents: 4500, explanation: 'Lik fordeling: 50%' },
    { invoiceId: inv6.id, userId: marta.id,   shareCents: 4500, explanation: 'Lik fordeling: 50%' },
  ]});

  // Personforsikring – 121,50 kr – 100% Andreas – Tryg
  const inv7 = await prisma.invoice.create({
    data: {
      familyId: family.id, periodId: period.id,
      category: 'Forsikring', vendor: 'Tryg Forsikring',
      description: 'Personforsikring Andreas',
      totalCents: 12150, distributionMethod: DistributionMethod.BY_PERCENT,
      distribution: { create: { method: DistributionMethod.BY_PERCENT, percentRules: [{ userId: andreas.id, percentBasisPoints: 10000 }] } },
      paymentMethod: 'AvtaleGiro',
    },
  });
  await prisma.invoiceShare.createMany({ data: [
    { invoiceId: inv7.id, userId: andreas.id, shareCents: 12150, explanation: '100% andel' },
  ]});

  // Nordea Liv Forsikring – 588,01 kr – BY_PERCENT (Andreas 44.69%, Marta 55.31%)
  // Andreas: 262.80 / 588.01 = 44.69%, Marta: 325.21 / 588.01 = 55.31%
  const inv8 = await prisma.invoice.create({
    data: {
      familyId: family.id, periodId: period.id,
      category: 'Forsikring', vendor: 'Nordea Liv',
      description: 'Livsforsikring',
      totalCents: 58801, distributionMethod: DistributionMethod.BY_PERCENT,
      distribution: { create: {
        method: DistributionMethod.BY_PERCENT,
        percentRules: [
          { userId: andreas.id, percentBasisPoints: 4469 },
          { userId: marta.id,   percentBasisPoints: 5531 },
        ],
      }},
      paymentMethod: 'AvtaleGiro',
    },
  });
  await prisma.invoiceShare.createMany({ data: [
    { invoiceId: inv8.id, userId: andreas.id, shareCents: 26280, explanation: '44.69% andel' },
    { invoiceId: inv8.id, userId: marta.id,   shareCents: 32521, explanation: '55.31% andel' },
  ]});

  // Barneforsikring – 652,38 kr – BY_INCOME – Tryg
  const inv9 = await prisma.invoice.create({
    data: {
      familyId: family.id, periodId: period.id,
      category: 'Forsikring', vendor: 'Tryg Forsikring',
      description: 'Barneforsikring',
      totalCents: 65238, distributionMethod: DistributionMethod.BY_INCOME,
      paymentMethod: 'AvtaleGiro',
    },
  });
  const s9 = byIncome(inv9.totalCents);
  await prisma.invoiceShare.createMany({ data: [
    { invoiceId: inv9.id, userId: andreas.id, shareCents: s9.andreas, explanation: `Inntektsbasert andel: ${(andreasIncome/total*100).toFixed(2)}%` },
    { invoiceId: inv9.id, userId: marta.id,   shareCents: s9.marta,   explanation: `Inntektsbasert andel: ${(martaIncome/total*100).toFixed(2)}%` },
  ]});

  // ─── BIL ─────────────────────────────────────────────────────────────────

  // LOfavør Billån – 3 789 kr – BY_INCOME – Sparebank 1 Sør-Norge
  const inv10 = await prisma.invoice.create({
    data: {
      familyId: family.id, periodId: period.id,
      category: 'Bil', vendor: 'Sparebank 1 Sør-Norge',
      description: 'LOfavør Billån',
      totalCents: 378900, distributionMethod: DistributionMethod.BY_INCOME,
      paymentMethod: 'AvtaleGiro',
    },
  });
  const s10 = byIncome(inv10.totalCents);
  await prisma.invoiceShare.createMany({ data: [
    { invoiceId: inv10.id, userId: andreas.id, shareCents: s10.andreas, explanation: `Inntektsbasert andel: ${(andreasIncome/total*100).toFixed(2)}%` },
    { invoiceId: inv10.id, userId: marta.id,   shareCents: s10.marta,   explanation: `Inntektsbasert andel: ${(martaIncome/total*100).toFixed(2)}%` },
  ]});

  console.log('Created 10 invoices');

  // ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────

  await prisma.subscription.create({
    data: {
      familyId: family.id,
      name: 'Boliglån',
      vendor: 'Sparebank 1',
      category: 'Bolig',
      amountCents: 1919800,
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      startDate: new Date('2024-01-01'),
      distributionMethod: DistributionMethod.BY_INCOME,
      distributionRules: {},
      active: true,
    },
  });

  await prisma.subscription.create({
    data: {
      familyId: family.id,
      name: 'Strøm & Nettleie',
      vendor: 'Vibb',
      category: 'Bolig',
      amountCents: 437753,
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      startDate: new Date('2024-01-01'),
      distributionMethod: DistributionMethod.BY_INCOME,
      distributionRules: {},
      active: true,
    },
  });

  await prisma.subscription.create({
    data: {
      familyId: family.id,
      name: 'Internett & TV',
      vendor: 'Telenor',
      category: 'Bolig',
      amountCents: 89900,
      frequency: 'MONTHLY',
      dayOfMonth: 5,
      startDate: new Date('2024-01-01'),
      distributionMethod: DistributionMethod.BY_INCOME,
      distributionRules: {},
      active: true,
    },
  });

  await prisma.subscription.create({
    data: {
      familyId: family.id,
      name: 'Innboforsikring',
      vendor: 'Fremtind Forsikring',
      category: 'Forsikring',
      amountCents: 296200,
      frequency: 'MONTHLY',
      dayOfMonth: 1,
      startDate: new Date('2024-01-01'),
      distributionMethod: DistributionMethod.BY_INCOME,
      distributionRules: {},
      active: true,
    },
  });

  await prisma.subscription.create({
    data: {
      familyId: family.id,
      name: 'Billån',
      vendor: 'Sparebank 1 Sør-Norge',
      category: 'Bil',
      amountCents: 378900,
      frequency: 'MONTHLY',
      dayOfMonth: 25,
      startDate: new Date('2024-01-01'),
      distributionMethod: DistributionMethod.BY_INCOME,
      distributionRules: {},
      active: true,
    },
  });

  console.log('Created 5 subscriptions');

  console.log('\nSeed completed!');
  console.log(`  Users: andreas / marta (password: kostpass)`);
  console.log(`  Period: 2026-02 (open)`);
  console.log(`  Invoices: 10 (Bolig, Forsikring, Bil)`);
  console.log(`  Subscriptions: 5`);
}

main()
  .catch((e) => { console.error('Seeding failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
