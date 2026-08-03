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

/** Lamela ma sztywną wysokość - liczba lameli w module rośnie skokowo, nie
 * płynnie, więc nie da się trafić w dowolny wymiar dokładnie. Moduł musi
 * fizycznie zmieścić się w otworze, więc dobieramy NAJWIĘKSZY wiersz z
 * coverageCm <= dostępne miejsce (zaokrąglenie w dół) - budowany moduł
 * wychodzi zawsze mniejszy lub równy żądanemu wymiarowi, nigdy większy. */
export function findCoverageRow(
  orientation: LamelaOrientation,
  maxCoverageCm: number,
  table: CoverageRow[],
): CoverageRow {
  const candidates = table
    .filter((r) => r.orientation === orientation)
    .sort((a, b) => b.coverageCm - a.coverageCm);

  const row = candidates.find((r) => r.coverageCm <= maxCoverageCm);
  if (!row) {
    const min = candidates.at(-1)?.coverageCm ?? 0;
    throw new PricingError(
      `Dostępne miejsce ${maxCoverageCm.toFixed(1)} cm jest mniejsze niż minimalne pokrycie w tabeli (${min} cm) - nawet najmniejszy moduł się nie zmieści.`,
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

function priceForLength(
  priceByLength: Map<number, number>,
  lengthCm: number,
): number {
  const price = priceByLength.get(lengthCm);
  if (price === undefined) {
    throw new PricingError(`Brak ceny w cenniku dla długości ${lengthCm} cm.`);
  }
  return price;
}

export function computeModuleCost(
  input: ModuleInput,
  catalog: PriceCatalog,
): ModuleCostResult {
  const { type, widthCm, heightCm, orientation, finish, okucieMaterial } =
    input;

  if (widthCm <= 0 || heightCm <= 0) {
    throw new PricingError(
      "Szerokość i wysokość modułu muszą być większe od zera.",
    );
  }

  // Wymiar "od liczby lameli" (stos okuć) i wymiar "wzdłuż lameli" (długość
  // cięcia) zależą od orientacji.
  const stackDimCm = orientation === "POZIOMO" ? heightCm : widthCm;
  const lamelDimCm = orientation === "POZIOMO" ? widthCm : heightCm;

  const maxCoverageCm = stackDimCm - FRAME_LUZ_CM - 2 * FRAME_PROFILE_WIDTH_CM;
  if (maxCoverageCm <= 0) {
    throw new PricingError(
      `Wymiar ${stackDimCm} cm jest za mały, aby zmieścić ramę i luz montażowy.`,
    );
  }
  const coverageRow = findCoverageRow(
    orientation,
    maxCoverageCm,
    catalog.coverageTable,
  );
  // Rzeczywisty, fizycznie budowany wymiar w kierunku "od liczby lameli" -
  // z racji skokowego wzrostu co lamelę będzie <= żądanemu wymiarowi. Rama
  // musi być dopasowana do tego, co faktycznie powstanie, nie do życzenia.
  const actualStackDimCm = round2(
    coverageRow.coverageCm + FRAME_LUZ_CM + 2 * FRAME_PROFILE_WIDTH_CM,
  );
  const actualWidthCm = orientation === "POZIOMO" ? widthCm : actualStackDimCm;
  const actualHeightCm =
    orientation === "POZIOMO" ? actualStackDimCm : heightCm;

  const neededLamelLengthCm = lamelDimCm - 2 * FRAME_PROFILE_WIDTH_CM;
  if (neededLamelLengthCm <= 0) {
    throw new PricingError(
      `Wymiar ${lamelDimCm} cm jest za mały, aby zmieścić ramę.`,
    );
  }
  const lamelPrices = catalog.lamelaPrices[finish];
  const lamelLengthCm = pickStrictlyGreaterLength(
    neededLamelLengthCm,
    lamelPrices,
  );
  const lamelUnitPrice = priceForLength(lamelPrices, lamelLengthCm);

  const frameWidthProfileLengthCm = pickStrictlyGreaterLength(
    actualWidthCm,
    catalog.framePrices,
  );
  const frameHeightProfileLengthCm = pickStrictlyGreaterLength(
    actualHeightCm,
    catalog.framePrices,
  );
  const frameWidthPrice = priceForLength(
    catalog.framePrices,
    frameWidthProfileLengthCm,
  );
  const frameHeightPrice = priceForLength(
    catalog.framePrices,
    frameHeightProfileLengthCm,
  );

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
    frameWidthProfileLengthCm,
    frameHeightProfileLengthCm,
    actualWidthCm,
    actualHeightCm,
    lines,
    costNetPln,
  };
}

/** Gdy pojedynczy odcinek z cennika nie pokrywa całej potrzebnej długości,
 * klient łączy samodzielnie kilka odcinków najdłuższej dostępnej długości -
 * więc zamiast blokować wycenę, dobieramy tyle sztuk, ile potrzeba. Ilość
 * jest tylko punktem startowym: użytkownik doda/odejmie ją ręcznie w
 * rozpisce kosztu, jeśli łączy odcinki inaczej. */
export function pickJoinedLength(
  neededCm: number,
  priceByLength: Map<number, number>,
): { lengthCm: number; count: number } {
  const single = tryPickStrictlyGreaterLength(neededCm, priceByLength);
  if (single !== undefined) return { lengthCm: single, count: 1 };

  const lengths = [...priceByLength.keys()].sort((a, b) => a - b);
  const maxLen = lengths.at(-1);
  if (maxLen === undefined || maxLen <= 0) {
    throw new PricingError("Brak żadnej długości w cenniku.");
  }
  let count = Math.ceil(neededCm / maxLen);
  if (count * maxLen <= neededCm) count += 1;
  return { lengthCm: maxLen, count };
}

function tryPickStrictlyGreaterLength(
  neededCm: number,
  priceByLength: Map<number, number>,
): number | undefined {
  const lengths = [...priceByLength.keys()].sort((a, b) => a - b);
  return lengths.find((l) => l > neededCm);
}

/** Wspólna szyna górna i prowadnica dolna dla całego otworu - liczona raz,
 * na szerokość zadeklarowanego otworu do zabudowy, jeśli otwór zawiera co
 * najmniej jeden moduł jezdny. Jeśli szerokość otworu przekracza najdłuższy
 * dostępny w cenniku odcinek, dobieramy kilka odcinków do złączenia zamiast
 * blokować dodanie modułu - dokładną ilość klient dostosuje sam w rozpisce. */
export function computeOpeningSlidingRailCost(
  openingWidthCm: number,
  catalog: PriceCatalog,
): OpeningSlidingRailResult {
  if (openingWidthCm <= 0) {
    throw new PricingError("Szerokość otworu musi być większa od zera.");
  }

  const top = pickJoinedLength(openingWidthCm, catalog.slidingTopPrices);
  const bottom = pickJoinedLength(openingWidthCm, catalog.slidingBottomPrices);
  const topPrice = priceForLength(catalog.slidingTopPrices, top.lengthCm);
  const bottomPrice = priceForLength(
    catalog.slidingBottomPrices,
    bottom.lengthCm,
  );

  const lines: ModuleCostResult["lines"] = [
    {
      label:
        `Profil górny do drzwi przesuwnych ${top.lengthCm} cm` +
        (top.count > 1 ? ` (${top.count} odcinki, łączone samodzielnie)` : ""),
      quantity: top.count,
      unitPriceNetPln: topPrice,
      totalNetPln: round2(top.count * topPrice),
    },
    {
      label:
        `Profil dolny do drzwi przesuwnych ${bottom.lengthCm} cm` +
        (bottom.count > 1
          ? ` (${bottom.count} odcinki, łączone samodzielnie)`
          : ""),
      quantity: bottom.count,
      unitPriceNetPln: bottomPrice,
      totalNetPln: round2(bottom.count * bottomPrice),
    },
  ];

  return {
    topProfileLengthCm: top.lengthCm,
    bottomProfileLengthCm: bottom.lengthCm,
    lines,
    costNetPln: round2(top.count * topPrice + bottom.count * bottomPrice),
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
