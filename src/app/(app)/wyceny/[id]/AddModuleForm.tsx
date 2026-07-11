"use client";

import { useState } from "react";
import {
  computeDimensionDeviationCm,
  formatDimensionDeviationLabel,
} from "@/lib/pricing/opening-fit";
import type { LamelaOrientation } from "@/lib/pricing/types";

const FINISH_OPTIONS = [
  { value: "MALOWANA_RAL", label: "Malowana RAL" },
  { value: "DREWNOPODOBNA", label: "Drewnopodobna" },
];

const OKUCIE_OPTIONS = [
  { value: "ALUMINIOWE", label: "Aluminiowe" },
  { value: "PLASTIKOWE", label: "Plastikowe" },
];

const ORIENTATION_OPTIONS = [
  { value: "POZIOMO", label: "Lamele poziome" },
  { value: "PIONOWO", label: "Lamele pionowe" },
];

const TYPE_OPTIONS = [
  { value: "STALY", label: "Stały" },
  { value: "JEZDNY", label: "Jezdny (przesuwny)" },
];

function parseCm(raw: string): number | null {
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function AddModuleForm({
  action,
  openingWidthCm,
  openingHeightCm,
}: {
  action: (formData: FormData) => void;
  openingWidthCm: number;
  openingHeightCm: number;
}) {
  const [orientation, setOrientation] = useState<LamelaOrientation>("POZIOMO");
  const [widthCm, setWidthCm] = useState("");
  const [heightCm, setHeightCm] = useState("");

  const parsedWidth = parseCm(widthCm);
  const parsedHeight = parseCm(heightCm);
  const relevantDimSet = orientation === "POZIOMO" ? parsedHeight !== null : parsedWidth !== null;

  const deviationLabel =
    relevantDimSet && parsedWidth !== null && parsedHeight !== null
      ? formatDimensionDeviationLabel(
          orientation,
          computeDimensionDeviationCm(orientation, parsedWidth, parsedHeight, openingWidthCm, openingHeightCm),
        )
      : null;

  return (
    <form action={action} className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Typ</label>
        <select name="type" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Szerokość (cm)</label>
        <input
          name="widthCm"
          required
          value={widthCm}
          onChange={(e) => setWidthCm(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Wysokość (cm)</label>
        <input
          name="heightCm"
          required
          value={heightCm}
          onChange={(e) => setHeightCm(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Orientacja</label>
        <select
          name="orientation"
          value={orientation}
          onChange={(e) => setOrientation(e.target.value as LamelaOrientation)}
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          {ORIENTATION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Wykończenie</label>
        <select name="finish" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
          {FINISH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">Okucie</label>
        <select name="okucieMaterial" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
          {OKUCIE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="mb-1 block text-xs font-medium text-neutral-600">Kolor RAL (opcjonalnie)</label>
        <input
          name="ralColor"
          placeholder="np. RAL 7016"
          className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Dodaj moduł
        </button>
      </div>
      {deviationLabel && (
        <div className="sm:col-span-3 lg:col-span-6 text-xs text-neutral-500">
          Moduł będzie {deviationLabel} ({orientation === "POZIOMO" ? "wysokość otworu" : "szerokość otworu"}{" "}
          {orientation === "POZIOMO" ? openingHeightCm : openingWidthCm} cm).
        </div>
      )}
    </form>
  );
}
