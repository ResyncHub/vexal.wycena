import type { LamelaOrientation } from "./types";

/** Dla lameli poziomych porównujemy wysokość modułu z wysokością otworu;
 * dla pionowych - szerokość modułu z szerokością otworu (wymiar "wzdłuż
 * kierunku sztywnego kroku lameli"). Dodatnia wartość = moduł mniejszy od
 * otworu w tym wymiarze. */
export function computeDimensionDeviationCm(
  orientation: LamelaOrientation,
  moduleWidthCm: number,
  moduleHeightCm: number,
  openingWidthCm: number,
  openingHeightCm: number,
): number {
  return orientation === "POZIOMO"
    ? openingHeightCm - moduleHeightCm
    : openingWidthCm - moduleWidthCm;
}

export function formatDimensionDeviationLabel(
  orientation: LamelaOrientation,
  deviationCm: number,
): string {
  const rounded = Math.round(deviationCm * 10) / 10;
  const smallerWord = orientation === "POZIOMO" ? "niższy" : "węższy";
  const biggerWord = orientation === "POZIOMO" ? "wyższy" : "szerszy";
  const dimWord = orientation === "POZIOMO" ? "wysokość" : "szerokość";

  if (rounded === 0) return `dokładnie na ${dimWord} otworu`;
  if (rounded > 0) return `o ${rounded} cm ${smallerWord} niż otwór`;
  return `o ${Math.abs(rounded)} cm ${biggerWord} niż otwór`;
}
