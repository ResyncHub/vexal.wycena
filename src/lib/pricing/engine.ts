import type {
  CoverageRow,
  LamelaOrientation,
  ModuleCostResult,
  ModuleInput,
  OpeningSlidingRailResult,
  PriceCatalog,
} from "./types";

// Stałe geometrii ramy (potwierdzone z klientem):
// - luz między okuciem a ramą liczony w kierunku "stosu" (poprzecznym do
//   długości lameli) wynosi łącznie 3,5 cm (po obu stronach razem)
// - profil ramy ma szerokość 4 cm i wchodzi w wymiar z obu stron (2x)
export const FRAME_LUZ_CM = 3.5;
export const FRAME_PROFILE_WIDTH_CM = 4;

export class PricingError extends Error {}

/** Zaokrąglenie "w górę" wg tabeli producenta: najmniejszy wiersz z
 * coverageCm >= potrzebne pokrycie (dopuszcza dokładne trafienie). */
export function findCoverageRow(
  orientation: LamelaOrientation,
  neededCoverageCm: number,
  table: CoverageRow[],
): CoverageRow {
  const candidates = table
    .filter((r) => r.orientation === orientation)
    .sort((a, b) => a.coverageCm - b.coverageCm);

  const row = candidates.find((r) => r.coverageCm >= neededCoverageCm);
  if (!row) {
    const max = candidates.at(-1)?.coverageCm ?? 0;
    throw new PricingError(
      `Potrzebne pokrycie ${neededCoverageCm.toFixed(1)} cm przekracza maksimum dostępne w tabeli (${max} cm). Podziel otwór na więcej modułów.`,
    );
  }
  return row;
}

/** Zasada naddatku przy zamawianiu materiału: zawsze ściśle w górę, nawet
 * przy dokładnym trafieniu w dostępny rozmiar katalogowy (nigdy równo). */
export function pickStrictlyGreaterLength(
  neededCm: number,
  priceByLength: Map<number, number>,
): number {
  const lengths = [...priceByLength.keys()].sort((a, b) => a - b);
  const length = lengths.find((l) => l > neededCm);
  if (length === undefined) {
    const max = lengths.at(-1) ?? 0;
    throw new PricingError(
      `Potrzebna długość ${neededCm.toFixed(1)} cm przekracza maksimum dostępne w cenniku (${max} cm).`,
    );
  }
  return length;
}

function priceForLength(priceByLength: Map<number, number>, lengthCm: number): number {
  const price = priceByLength.get(lengthCm);
  if (price === undefined) {
    throw new PricingError(`Brak ceny w cenniku dla długości ${lengthCm} cm.`);
  }
  return price;
}

/** Lamele mają sztywny skok (każda dokłada tyle samo do stosu), więc
 * rzeczywisty wymiar gotowego modułu po stronie lameli wynika z liczby
 * lameli w wybranym wierszu tabeli pokrycia, a nie z wpisanej wartości -
 * prawie nigdy nie trafi się dokładnie w to, co wpisano. */
export function computeActualStackDimCm(
  orientation: LamelaOrientation,
  stackDimCm: number,
  coverageTable: CoverageRow[],
): { coverageRow: CoverageRow; actualStackDimCm: number } {
  const neededCoverageCm = stackDimCm - FRAME_LUZ_CM - 2 * FRAME_PROFILE_WIDTH_CM;
  if (neededCoverageCm <= 0) {
    throw new PricingError(
      `Wymiar ${stackDimCm} cm jest za mały, aby zmieścić ramę i luz montażowy.`,
    );
  }
  const coverageRow = findCoverageRow(orientation, neededCoverageCm, coverageTable);
  const actualStackDimCm = round2(coverageRow.coverageCm + FRAME_LUZ_CM + 2 * FRAME_PROFILE_WIDTH_CM);
  return { coverageRow, actualStackDimCm };
}

export function computeModuleCost(
  input: ModuleInput,
  catalog: PriceCatalog,
): ModuleCostResult {
  const { type, widthCm, heightCm, orientation, finish, okucieMaterial } = input;

  if (widthCm <= 0 || heightCm <= 0) {
    throw new PricingError("Szerokość i wysokość modułu muszą być większe od zera.");
  }

  // Wymiar "od liczby lameli" (stos okuć) i wymiar "wzdłuż lameli" (długość
  // cięcia) zależą od orientacji.
  const stackDimCm = orientation === "POZIOMO" ? heightCm : widthCm;
  const lamelDimCm = orientation === "POZIOMO" ? widthCm : heightCm;

  const { coverageRow, actualStackDimCm } = computeActualStackDimCm(
    orientation,
    stackDimCm,
    catalog.coverageTable,
  );

  // Rama musi faktycznie pomieścić stos lameli, więc jej wymiar po stronie
  // lameli liczymy od wymiaru rzeczywistego (po zaokrągleniu do liczby
  // lameli), a nie od wpisanej wartości - inaczej rama mogłaby wyjść za
  // krótka na realnie złożony moduł.
  const actualWidthCm = orientation === "POZIOMO" ? widthCm : actualStackDimCm;
  const actualHeightCm = orientation === "POZIOMO" ? actualStackDimCm : heightCm;

  const neededLamelLengthCm = lamelDimCm - 2 * FRAME_PROFILE_WIDTH_CM;
  if (neededLamelLengthCm <= 0) {
    throw new PricingError(
      `Wymiar ${lamelDimCm} cm jest za mały, aby zmieścić ramę.`,
    );
  }
  const lamelPrices = catalog.lamelaPrices[finish];
  const lamelLengthCm = pickStrictlyGreaterLength(neededLamelLengthCm, lamelPrices);
  const lamelUnitPrice = priceForLength(lamelPrices, lamelLengthCm);

  const frameWidthProfileLengthCm = pickStrictlyGreaterLength(actualWidthCm, catalog.framePrices);
  const frameHeightProfileLengthCm = pickStrictlyGreaterLength(actualHeightCm, catalog.framePrices);
  const frameWidthPrice = priceForLength(catalog.framePrices, frameWidthProfileLengthCm);
  const frameHeightPrice = priceForLength(catalog.framePrices, frameHeightProfileLengthCm);

  const okucieUnitPrice = catalog.okucieSetPrices[okucieMaterial];

  const lines: ModuleCostResult["lines"] = [
    {
      label: `Lamela ${finish === "MALOWANA_RAL" ? "malowana RAL" : "drewnopodobna"} ${lamelLengthCm} cm`,
      quantity: coverageRow.lamelCount,
      unitPriceNetPln: lamelUnitPrice,
      totalNetPln: round2(coverageRow.lamelCount * lamelUnitPrice),
    },
    {
      label: `Okucie ${okucieMaterial === "ALUMINIOWE" ? "aluminiowe" : "plastikowe"} (zestaw do 6 lameli)`,
      quantity: coverageRow.uchwytSets,
      unitPriceNetPln: okucieUnitPrice,
      totalNetPln: round2(coverageRow.uchwytSets * okucieUnitPrice),
    },
    {
      label: `Profil ramy ${frameWidthProfileLengthCm} cm (szerokość)`,
      quantity: 2,
      unitPriceNetPln: frameWidthPrice,
      totalNetPln: round2(2 * frameWidthPrice),
    },
    {
      label: `Profil ramy ${frameHeightProfileLengthCm} cm (wysokość)`,
      quantity: 2,
      unitPriceNetPln: frameHeightPrice,
      totalNetPln: round2(2 * frameHeightPrice),
    },
  ];

  if (type === "JEZDNY") {
    lines.push({
      label: "Okucie do drzwi przesuwnych (wózek jezdny)",
      quantity: 1,
      unitPriceNetPln: catalog.slidingCarriageSetPriceNetPln,
      totalNetPln: round2(catalog.slidingCarriageSetPriceNetPln),
    });
    lines.push({
      label: "Rolka prowadząca dolna",
      quantity: 2,
      unitPriceNetPln: catalog.slidingGuideRollerPriceNetPln,
      totalNetPln: round2(2 * catalog.slidingGuideRollerPriceNetPln),
    });
  }

  const costNetPln = round2(lines.reduce((sum, l) => sum + l.totalNetPln, 0));

  return {
    lamelCount: coverageRow.lamelCount,
    lamelLengthCm,
    uchwytSets: coverageRow.uchwytSets,
    actualWidthCm,
    actualHeightCm,
    frameWidthProfileLengthCm,
    frameHeightProfileLengthCm,
    lines,
    costNetPln,
  };
}

/** Wspólna szyna górna i prowadnica dolna dla całego otworu - liczona raz,
 * na szerokość zadeklarowanego otworu do zabudowy, jeśli otwór zawiera co
 * najmniej jeden moduł jezdny. */
export function computeOpeningSlidingRailCost(
  openingWidthCm: number,
  catalog: PriceCatalog,
): OpeningSlidingRailResult {
  if (openingWidthCm <= 0) {
    throw new PricingError("Szerokość otworu musi być większa od zera.");
  }

  const topProfileLengthCm = pickStrictlyGreaterLength(openingWidthCm, catalog.slidingTopPrices);
  const bottomProfileLengthCm = pickStrictlyGreaterLength(openingWidthCm, catalog.slidingBottomPrices);
  const topPrice = priceForLength(catalog.slidingTopPrices, topProfileLengthCm);
  const bottomPrice = priceForLength(catalog.slidingBottomPrices, bottomProfileLengthCm);

  const lines: ModuleCostResult["lines"] = [
    {
      label: `Profil górny do drzwi przesuwnych ${topProfileLengthCm} cm`,
      quantity: 1,
      unitPriceNetPln: topPrice,
      totalNetPln: round2(topPrice),
    },
    {
      label: `Profil dolny do drzwi przesuwnych ${bottomProfileLengthCm} cm`,
      quantity: 1,
      unitPriceNetPln: bottomPrice,
      totalNetPln: round2(bottomPrice),
    },
  ];

  return {
    topProfileLengthCm,
    bottomProfileLengthCm,
    lines,
    costNetPln: round2(topPrice + bottomPrice),
  };
}

export const NET_TO_GROSS_VAT_MULTIPLIER = 1.23;

/** Zamiana kosztu netto (cennik dostawcy) na koszt brutto, jaki faktycznie
 * płaci firma jako nievatowiec (kupuje w brutto, bez odliczenia VAT). */
export function netToGrossCost(netPln: number): number {
  return round2(netPln * NET_TO_GROSS_VAT_MULTIPLIER);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
