import { describe, expect, it } from "vitest";
import { computeDimensionDeviationCm, formatDimensionDeviationLabel } from "./opening-fit";

describe("computeDimensionDeviationCm", () => {
  it("dla lameli poziomych porównuje wysokość modułu z wysokością otworu", () => {
    expect(computeDimensionDeviationCm("POZIOMO", 160, 220, 160, 225)).toBe(5);
  });

  it("dla lameli pionowych porównuje szerokość modułu z szerokością otworu", () => {
    expect(computeDimensionDeviationCm("PIONOWO", 140, 220, 160, 220)).toBe(20);
  });

  it("zwraca wartość ujemną, gdy moduł jest większy od otworu", () => {
    expect(computeDimensionDeviationCm("POZIOMO", 160, 230, 160, 220)).toBe(-10);
  });
});

describe("formatDimensionDeviationLabel", () => {
  it("opisuje moduł niższy niż otwór dla lameli poziomych", () => {
    expect(formatDimensionDeviationLabel("POZIOMO", 5)).toBe("o 5 cm niższy niż otwór");
  });

  it("opisuje moduł węższy niż otwór dla lameli pionowych", () => {
    expect(formatDimensionDeviationLabel("PIONOWO", 20)).toBe("o 20 cm węższy niż otwór");
  });

  it("opisuje moduł większy od otworu jako wyższy/szerszy", () => {
    expect(formatDimensionDeviationLabel("POZIOMO", -10)).toBe("o 10 cm wyższy niż otwór");
  });

  it("opisuje dokładne dopasowanie", () => {
    expect(formatDimensionDeviationLabel("POZIOMO", 0)).toBe("dokładnie na wysokość otworu");
  });
});
