import { describe, expect, it } from "vitest";
import {
  computeModuleCost,
  computeOpeningSlidingRailCost,
  findCoverageRow,
  netToGrossCost,
  pickStrictlyGreaterLength,
  PricingError,
} from "./engine";
import type { PriceCatalog } from "./types";
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
} from "./seed-data";

function buildTestCatalog(): PriceCatalog {
  return {
    lamelaPrices: {
      MALOWANA_RAL: new Map(LAMELA_MALOWANA_RAL),
      DREWNOPODOBNA: new Map(LAMELA_DREWNOPODOBNA),
    },
    framePrices: new Map(PROFIL_RAMA),
    slidingTopPrices: new Map(PROFIL_DRZWI_GORNY),
    slidingBottomPrices: new Map(PROFIL_DRZWI_DOLNY),
    okucieSetPrices: {
      ALUMINIOWE: OKUCIE_ALUMINIOWE_NET_PLN,
      PLASTIKOWE: OKUCIE_PLASTIKOWE_NET_PLN,
    },
    slidingCarriageSetPriceNetPln: SLIDING_CARRIAGE_SET_NET_PLN,
    slidingGuideRollerPriceNetPln: SLIDING_GUIDE_ROLLER_NET_PLN,
    coverageTable: COVERAGE_TABLE.flatMap(
      ([coverageCm, lamelCount, uchwytSets]) => [
        { orientation: "POZIOMO" as const, coverageCm, lamelCount, uchwytSets },
        { orientation: "PIONOWO" as const, coverageCm, lamelCount, uchwytSets },
      ],
    ),
  };
}

describe("pickStrictlyGreaterLength", () => {
  it("wybiera najmniejszą dostępną długość ściśle większą od potrzebnej", () => {
    const map = new Map([
      [50, 1],
      [60, 2],
      [70, 3],
    ]);
    expect(pickStrictlyGreaterLength(55, map)).toBe(60);
  });

  it("przy dokładnym trafieniu w rozmiar katalogowy bierze następny większy (nigdy równo)", () => {
    const map = new Map([
      [140, 1],
      [160, 2],
    ]);
    expect(pickStrictlyGreaterLength(140, map)).toBe(160);
  });

  it("dla wartości poniżej minimum katalogowego bierze minimum", () => {
    const map = new Map([
      [50, 1],
      [60, 2],
    ]);
    expect(pickStrictlyGreaterLength(10, map)).toBe(50);
  });

  it("rzuca błąd gdy potrzebna długość przekracza maksimum katalogu", () => {
    const map = new Map([[50, 1]]);
    expect(() => pickStrictlyGreaterLength(100, map)).toThrow(PricingError);
  });
});

describe("findCoverageRow", () => {
  const table = buildTestCatalog().coverageTable;

  it("przy dokładnym trafieniu w wartość z tabeli zwraca ten sam wiersz (<=, dopuszcza równość)", () => {
    const row = findCoverageRow("POZIOMO", 58.4, table);
    expect(row.lamelCount).toBe(6);
    expect(row.uchwytSets).toBe(1);
  });

  it("zaokrągla w dół do najbliższej niższej wartości - moduł nie może wyjść większy niż dostępne miejsce", () => {
    const row = findCoverageRow("POZIOMO", 208.5, table);
    expect(row.coverageCm).toBe(202.2);
    expect(row.lamelCount).toBe(21);
    expect(row.uchwytSets).toBe(4);
    expect(row.coverageCm).toBeLessThanOrEqual(208.5);
  });

  it("rzuca błąd gdy dostępne miejsce jest mniejsze niż minimalne pokrycie w tabeli", () => {
    expect(() => findCoverageRow("POZIOMO", 10, table)).toThrow(PricingError);
  });
});

describe("computeModuleCost - moduł stały 140x220", () => {
  const catalog = buildTestCatalog();

  it("orientacja POZIOMO: wysokość steruje liczbą lameli, rzeczywisty moduł wychodzi niższy niż żądany (nigdy wyższy)", () => {
    const result = computeModuleCost(
      {
        type: "STALY",
        widthCm: 140,
        heightCm: 220,
        orientation: "POZIOMO",
        finish: "MALOWANA_RAL",
        okucieMaterial: "PLASTIKOWE",
      },
      catalog,
    );

    expect(result.lamelCount).toBe(21);
    expect(result.lamelLengthCm).toBe(140);
    expect(result.uchwytSets).toBe(4);
    expect(result.actualWidthCm).toBe(140);
    expect(result.actualHeightCm).toBe(213.7);
    expect(result.actualHeightCm).toBeLessThanOrEqual(220);
    // Rama dopasowana do rzeczywistego (mniejszego) wymiaru, nie do żądanego
    expect(result.frameWidthProfileLengthCm).toBe(160);
    expect(result.frameHeightProfileLengthCm).toBe(220);
    expect(result.costNetPln).toBeCloseTo(1976.11, 2);
  });

  it("orientacja PIONOWO: szerokość steruje liczbą lameli, rzeczywisty moduł wychodzi węższy niż żądany (nigdy szerszy)", () => {
    const result = computeModuleCost(
      {
        type: "STALY",
        widthCm: 140,
        heightCm: 220,
        orientation: "PIONOWO",
        finish: "MALOWANA_RAL",
        okucieMaterial: "PLASTIKOWE",
      },
      catalog,
    );

    expect(result.lamelCount).toBe(13);
    expect(result.lamelLengthCm).toBe(220);
    expect(result.uchwytSets).toBe(3);
    expect(result.actualHeightCm).toBe(220);
    expect(result.actualWidthCm).toBeLessThanOrEqual(140);
  });

  it("moduł jezdny dolicza wózek i dwie rolki prowadzące", () => {
    const staly = computeModuleCost(
      {
        type: "STALY",
        widthCm: 140,
        heightCm: 220,
        orientation: "POZIOMO",
        finish: "MALOWANA_RAL",
        okucieMaterial: "PLASTIKOWE",
      },
      catalog,
    );
    const jezdny = computeModuleCost(
      {
        type: "JEZDNY",
        widthCm: 140,
        heightCm: 220,
        orientation: "POZIOMO",
        finish: "MALOWANA_RAL",
        okucieMaterial: "PLASTIKOWE",
      },
      catalog,
    );

    const expectedExtra =
      SLIDING_CARRIAGE_SET_NET_PLN + 2 * SLIDING_GUIDE_ROLLER_NET_PLN;
    expect(jezdny.costNetPln).toBeCloseTo(staly.costNetPln + expectedExtra, 2);
  });

  it("rzuca błąd dla zbyt małego wymiaru", () => {
    expect(() =>
      computeModuleCost(
        {
          type: "STALY",
          widthCm: 5,
          heightCm: 220,
          orientation: "POZIOMO",
          finish: "MALOWANA_RAL",
          okucieMaterial: "PLASTIKOWE",
        },
        catalog,
      ),
    ).toThrow(PricingError);
  });
});

describe("computeOpeningSlidingRailCost", () => {
  const catalog = buildTestCatalog();

  it("liczy szynę górną i prowadnicę dolną na szerokość całego otworu, z naddatkiem ścisłym", () => {
    const result = computeOpeningSlidingRailCost(300, catalog);
    expect(result.topProfileLengthCm).toBe(320);
    expect(result.bottomProfileLengthCm).toBe(320);
    expect(result.costNetPln).toBeCloseTo(206.44 + 93.66, 2);
  });

  it("dobiera kilka odcinków do samodzielnego złączenia zamiast blokować wycenę, gdy otwór jest szerszy niż najdłuższy odcinek w cenniku", () => {
    // Prowadnica dolna w danych testowych kończy się na 400 cm - otwór 470
    // cm nie mieści się w jednym odcinku, więc klient łączy dwa po 400 cm.
    const result = computeOpeningSlidingRailCost(470, catalog);
    expect(result.topProfileLengthCm).toBe(500);
    expect(result.bottomProfileLengthCm).toBe(400);
    const bottomLine = result.lines.find((l) => l.label.includes("dolny"));
    expect(bottomLine?.quantity).toBe(2);
    expect(result.costNetPln).toBeCloseTo(322.56 + 2 * 117.07, 2);
  });
});

describe("netToGrossCost", () => {
  it("dolicza VAT 23% do kosztu netto z cennika dostawcy (firma kupuje w brutto)", () => {
    expect(netToGrossCost(100)).toBeCloseTo(123, 2);
  });
});
