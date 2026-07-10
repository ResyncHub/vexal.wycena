import { db } from "@/lib/db";

/** Numer wyceny w formacie PREFIX/RRRR/MM/NNN, np. WYC/2026/07/001. */
export async function generateQuoteNumber(): Promise<string> {
  const settings = await db.companySettings.findUnique({ where: { id: "singleton" } });
  const prefix = settings?.quoteNumberPrefix ?? "WYC";

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const periodPrefix = `${prefix}/${year}/${month}/`;

  const countThisPeriod = await db.quote.count({
    where: { number: { startsWith: periodPrefix } },
  });

  const sequence = String(countThisPeriod + 1).padStart(3, "0");
  return `${periodPrefix}${sequence}`;
}
