import { db } from "@/lib/db";
import { toNumber } from "@/lib/decimal";
import type { LamelaFinish, OkucieMaterial, PriceCatalog } from "./types";

export async function loadPriceCatalog(): Promise<PriceCatalog> {
  const [lamelaRows, profileRows, okucieRows, fixedPartRows, coverageRows] =
    await Promise.all([
      db.lamelaPriceTier.findMany(),
      db.profilePriceTier.findMany(),
      db.okucieSetPrice.findMany(),
      db.fixedPricePart.findMany(),
      db.coverageLookupRow.findMany(),
    ]);

  const lamelaPrices: Record<LamelaFinish, Map<number, number>> = {
    MALOWANA_RAL: new Map(),
    DREWNOPODOBNA: new Map(),
  };
  for (const row of lamelaRows) {
    lamelaPrices[row.finish].set(row.lengthCm, toNumber(row.priceNetPln));
  }

  const framePrices = new Map<number, number>();
  const slidingTopPrices = new Map<number, number>();
  const slidingBottomPrices = new Map<number, number>();
  for (const row of profileRows) {
    const price = toNumber(row.priceNetPln);
    if (row.profileType === "RAMA") framePrices.set(row.lengthCm, price);
    else if (row.profileType === "DRZWI_PRZESUWNE_GORNY") slidingTopPrices.set(row.lengthCm, price);
    else if (row.profileType === "DRZWI_PRZESUWNE_DOLNY") slidingBottomPrices.set(row.lengthCm, price);
  }

  const okucieSetPrices: Record<OkucieMaterial, number> = {
    ALUMINIOWE: 0,
    PLASTIKOWE: 0,
  };
  for (const row of okucieRows) {
    okucieSetPrices[row.material] = toNumber(row.priceNetPln);
  }

  let slidingCarriageSetPriceNetPln = 0;
  let slidingGuideRollerPriceNetPln = 0;
  for (const row of fixedPartRows) {
    const price = toNumber(row.priceNetPln);
    if (row.code === "SLIDING_CARRIAGE_SET") slidingCarriageSetPriceNetPln = price;
    else if (row.code === "SLIDING_GUIDE_ROLLER") slidingGuideRollerPriceNetPln = price;
  }

  const coverageTable = coverageRows.map((row) => ({
    orientation: row.orientation,
    coverageCm: toNumber(row.coverageCm),
    lamelCount: row.lamelCount,
    uchwytSets: row.uchwytSets,
  }));

  return {
    lamelaPrices,
    framePrices,
    slidingTopPrices,
    slidingBottomPrices,
    okucieSetPrices,
    slidingCarriageSetPriceNetPln,
    slidingGuideRollerPriceNetPln,
    coverageTable,
  };
}
