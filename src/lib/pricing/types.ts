export type LamelaFinish = "MALOWANA_RAL" | "DREWNOPODOBNA";
export type OkucieMaterial = "ALUMINIOWE" | "PLASTIKOWE";
export type LamelaOrientation = "POZIOMO" | "PIONOWO";
export type ModuleType = "STALY" | "JEZDNY";

export interface CoverageRow {
  orientation: LamelaOrientation;
  coverageCm: number;
  lamelCount: number;
  uchwytSets: number;
}

export interface PriceCatalog {
  lamelaPrices: Record<LamelaFinish, Map<number, number>>;
  framePrices: Map<number, number>;
  slidingTopPrices: Map<number, number>;
  slidingBottomPrices: Map<number, number>;
  okucieSetPrices: Record<OkucieMaterial, number>;
  slidingCarriageSetPriceNetPln: number;
  slidingGuideRollerPriceNetPln: number;
  coverageTable: CoverageRow[];
}

export interface ModuleInput {
  type: ModuleType;
  widthCm: number;
  heightCm: number;
  orientation: LamelaOrientation;
  finish: LamelaFinish;
  okucieMaterial: OkucieMaterial;
}

export interface ModuleCostLine {
  label: string;
  quantity: number;
  unitPriceNetPln: number;
  totalNetPln: number;
}

export interface ModuleCostResult {
  lamelCount: number;
  lamelLengthCm: number;
  uchwytSets: number;
  /** Rzeczywisty wymiar gotowego modułu po stronie lameli (sztywny skok
   * lamela-po-lameli) - może różnić się od wpisanego widthCm/heightCm. */
  actualWidthCm: number;
  actualHeightCm: number;
  frameWidthProfileLengthCm: number;
  frameHeightProfileLengthCm: number;
  lines: ModuleCostLine[];
  costNetPln: number;
}

export interface OpeningSlidingRailResult {
  topProfileLengthCm: number;
  bottomProfileLengthCm: number;
  lines: ModuleCostLine[];
  costNetPln: number;
}
