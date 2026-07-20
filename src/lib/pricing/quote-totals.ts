import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { toNumber } from "@/lib/decimal";
import { computeOpeningSlidingRailCost, netToGrossCost, round2 } from "./engine";
import { loadPriceCatalog } from "./catalog";

/** Przelicza szynę górną/dolną dla otworu (jeśli zawiera moduł jezdny) i
 * zapisuje ją na QuoteOpening, po czym przelicza sumy całej wyceny. */
export async function recalculateOpeningRail(openingId: string) {
  const opening = await db.quoteOpening.findUniqueOrThrow({
    where: { id: openingId },
    include: { modules: true },
  });

  const hasSliding = opening.modules.some((m) => m.type === "JEZDNY");

  if (!hasSliding) {
    await db.quoteOpening.update({
      where: { id: openingId },
      data: {
        slidingTopProfileLengthCm: null,
        slidingBottomProfileLengthCm: null,
        slidingRailCostNetPln: 0,
        railBreakdownJson: Prisma.JsonNull,
      },
    });
  } else {
    const catalog = await loadPriceCatalog();
    const rail = computeOpeningSlidingRailCost(toNumber(opening.widthCm), catalog);
    await db.quoteOpening.update({
      where: { id: openingId },
      data: {
        slidingTopProfileLengthCm: rail.topProfileLengthCm,
        slidingBottomProfileLengthCm: rail.bottomProfileLengthCm,
        slidingRailCostNetPln: rail.costNetPln,
        railBreakdownJson: JSON.parse(JSON.stringify(rail.lines)),
      },
    });
  }

  await recalculateQuoteTotalsByOpeningId(openingId);
}

async function recalculateQuoteTotalsByOpeningId(openingId: string) {
  const opening = await db.quoteOpening.findUniqueOrThrow({ where: { id: openingId } });
  await recalculateQuoteTotals(opening.quoteId);
}

export async function recalculateQuoteTotals(quoteId: string) {
  const quote = await db.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: { openings: { include: { modules: true } } },
  });

  const modulesCostNet = quote.openings
    .flatMap((o) => o.modules)
    .reduce((sum, m) => sum + toNumber(m.costNetPln), 0);
  const railsCostNet = quote.openings.reduce((sum, o) => sum + toNumber(o.slidingRailCostNetPln), 0);

  const totalCostNetPln = round2(modulesCostNet + railsCostNet);
  const totalCostGrossPln = netToGrossCost(totalCostNetPln);

  const markupPercent = await getMarkupPercent();
  const withMarkup = round2(totalCostGrossPln * (1 + markupPercent / 100));
  const withInstallation = round2(withMarkup + toNumber(quote.installationPln));
  const withDiscount = round2(withInstallation * (1 - toNumber(quote.discountPercent) / 100));

  await db.quote.update({
    where: { id: quoteId },
    data: {
      totalCostPln: totalCostGrossPln,
      totalPricePln: withDiscount,
    },
  });
}

async function getMarkupPercent(): Promise<number> {
  const settings = await db.companySettings.findUnique({ where: { id: "singleton" } });
  return settings ? toNumber(settings.defaultMarkupPercent) : 0;
}
