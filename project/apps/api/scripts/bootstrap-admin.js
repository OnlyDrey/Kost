const { PrismaClient, UserRole } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function ensureAdmin() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME || "admin";
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "kostpass";
  const displayName = process.env.BOOTSTRAP_ADMIN_NAME || "Admin";

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(
      "[api] Skipping bootstrap admin creation because users already exist.",
    );
    return;
  }

  let family = await prisma.family.findFirst({ select: { id: true } });
  if (!family) {
    family = await prisma.family.create({
      data: {
        name: "Kost Family",
        categories: ["Bolig", "Forsikring", "Bil", "Dagligvarer", "Abonnement", "Annet"],
        paymentMethods: ["Felles konto", "AvtaleGiro", "Faktura"],
        currency: "NOK",
      },
      select: { id: true },
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      name: displayName,
      role: UserRole.ADMIN,
      familyId: family.id,
      passwordHash,
    },
    select: { username: true },
  });

  console.log(`[api] Bootstrap admin created: ${user.username}`);
}

ensureAdmin()
  .catch((error) => {
    console.error("[api] Failed to bootstrap admin account", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
