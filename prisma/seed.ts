import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import {
  COVERAGE_TABLE,
  LAMELA_DREWNOPODOBNA,
  LAMELA_MALOWANA_RAL,
  OKUCIE_ALUMINIOWE_NET_PLN,
  OKUCIE_PLASTIKOWE_NET_PLN,
  PROFIL_DRZWI_DOLNY,
  PROFIL_DRZWI_GORNY,
  PROFIL_RAMA,
  SLIDING_CARRIAGE_SET_NET_PLN,
  SLIDING_GUIDE_ROLLER_NET_PLN,
} from "../src/lib/pricing/seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.lamelaPriceTier.createMany({
    data: [
      ...LAMELA_MALOWANA_RAL.map(([lengthCm, priceNetPln]) => ({
        finish: "MALOWANA_RAL" as const,
        lengthCm,
        priceNetPln,
      })),
      ...LAMELA_DREWNOPODOBNA.map(([lengthCm, priceNetPln]) => ({
        finish: "DREWNOPODOBNA" as const,
        lengthCm,
        priceNetPln,
      })),
    ],
    skipDuplicates: true,
  });

  await prisma.profilePriceTier.createMany({
    data: [
      ...PROFIL_RAMA.map(([lengthCm, priceNetPln]) => ({
        profileType: "RAMA" as const,
        lengthCm,
        priceNetPln,
      })),
      ...PROFIL_DRZWI_GORNY.map(([lengthCm, priceNetPln]) => ({
        profileType: "DRZWI_PRZESUWNE_GORNY" as const,
        lengthCm,
        priceNetPln,
      })),
      ...PROFIL_DRZWI_DOLNY.map(([lengthCm, priceNetPln]) => ({
        profileType: "DRZWI_PRZESUWNE_DOLNY" as const,
        lengthCm,
        priceNetPln,
      })),
    ],
    skipDuplicates: true,
  });

  await prisma.okucieSetPrice.createMany({
    data: [
      { material: "ALUMINIOWE", priceNetPln: OKUCIE_ALUMINIOWE_NET_PLN },
      { material: "PLASTIKOWE", priceNetPln: OKUCIE_PLASTIKOWE_NET_PLN },
    ],
    skipDuplicates: true,
  });

  await prisma.fixedPricePart.createMany({
    data: [
      {
        code: "SLIDING_CARRIAGE_SET",
        label: "Okucie do drzwi przesuwnych (wózek jezdny)",
        priceNetPln: SLIDING_CARRIAGE_SET_NET_PLN,
      },
      {
        code: "SLIDING_GUIDE_ROLLER",
        label: "Rolka prowadząca dolna do drzwi przesuwnych",
        priceNetPln: SLIDING_GUIDE_ROLLER_NET_PLN,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.coverageLookupRow.createMany({
    data: COVERAGE_TABLE.flatMap(([coverageCm, lamelCount, uchwytSets]) => [
      { orientation: "POZIOMO" as const, coverageCm, lamelCount, uchwytSets },
      { orientation: "PIONOWO" as const, coverageCm, lamelCount, uchwytSets },
    ]),
    skipDuplicates: true,
  });

  await prisma.companySettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      name: "Twoja Firma",
      quoteValidityDays: 14,
      defaultMarkupPercent: 0,
      defaultInstallationPln: 0,
      quoteNumberPrefix: "VEX",
    },
    update: {},
  });

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "pjurasz.ai@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Glutamina22.";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Admin",
    },
    update: { passwordHash },
  });

  console.log("Seed OK.");
  console.log(`Konto logowania: ${adminEmail} / ${adminPassword} (zmień hasło po pierwszym logowaniu)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
