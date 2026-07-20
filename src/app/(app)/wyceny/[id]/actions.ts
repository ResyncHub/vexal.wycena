"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { computeModuleCost, PricingError } from "@/lib/pricing/engine";
import { loadPriceCatalog } from "@/lib/pricing/catalog";
import { recalculateOpeningRail, recalculateQuoteTotals } from "@/lib/pricing/quote-totals";
import type {
  LamelaFinish,
  LamelaOrientation,
  ModuleType,
  OkucieMaterial,
} from "@/lib/pricing/types";

export async function updateQuoteHeader(quoteId: string, formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  const clientId = get("clientId");
  const validUntilRaw = get("validUntil");

  await db.quote.update({
    where: { id: quoteId },
    data: {
      clientId: clientId || null,
      status: get("status") as "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED",
      markupPercent: Number(get("markupPercent").replace(",", ".")) || 0,
      discountPercent: Number(get("discountPercent").replace(",", ".")) || 0,
      installationPln: Number(get("installationPln").replace(",", ".")) || 0,
      notes: get("notes") || null,
      validUntil: validUntilRaw ? new Date(validUntilRaw) : null,
    },
  });

  await recalculateQuoteTotals(quoteId);
  revalidatePath(`/wyceny/${quoteId}`);
}

export async function addOpening(quoteId: string, formData: FormData) {
  const label = String(formData.get("label") ?? "").trim() || "Otwór";
  const widthCm = Number(String(formData.get("widthCm") ?? "").replace(",", "."));
  const heightCm = Number(String(formData.get("heightCm") ?? "").replace(",", "."));

  if (!Number.isFinite(widthCm) || widthCm <= 0) {
    throw new PricingError("Podaj poprawną szerokość otworu.");
  }
  if (!Number.isFinite(heightCm) || heightCm <= 0) {
    throw new PricingError("Podaj poprawną wysokość otworu.");
  }

  const count = await db.quoteOpening.count({ where: { quoteId } });

  await db.quoteOpening.create({
    data: { quoteId, label, widthCm, heightCm, position: count },
  });

  revalidatePath(`/wyceny/${quoteId}`);
}

export async function deleteOpening(quoteId: string, openingId: string) {
  await db.quoteOpening.delete({ where: { id: openingId } });
  await recalculateQuoteTotals(quoteId);
  revalidatePath(`/wyceny/${quoteId}`);
}

export async function addModule(quoteId: string, openingId: string, formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  const type = get("type") as ModuleType;
  const widthCm = Number(get("widthCm").replace(",", "."));
  const heightCm = Number(get("heightCm").replace(",", "."));
  const orientation = get("orientation") as LamelaOrientation;
  const finish = get("finish") as LamelaFinish;
  const okucieMaterial = get("okucieMaterial") as OkucieMaterial;
  const ralColor = get("ralColor") || null;

  const catalog = await loadPriceCatalog();
  const result = computeModuleCost(
    { type, widthCm, heightCm, orientation, finish, okucieMaterial },
    catalog,
  );

  const count = await db.quoteModule.count({ where: { openingId } });

  await db.quoteModule.create({
    data: {
      openingId,
      position: count,
      type,
      widthCm,
      heightCm,
      actualWidthCm: result.actualWidthCm,
      actualHeightCm: result.actualHeightCm,
      orientation,
      finish,
      ralColor,
      okucieMaterial,
      lamelCount: result.lamelCount,
      lamelLengthCm: result.lamelLengthCm,
      uchwytSets: result.uchwytSets,
      frameWidthProfileLengthCm: result.frameWidthProfileLengthCm,
      frameHeightProfileLengthCm: result.frameHeightProfileLengthCm,
      costBreakdownJson: JSON.parse(JSON.stringify(result.lines)),
      costNetPln: result.costNetPln,
    },
  });

  await recalculateOpeningRail(openingId);
  revalidatePath(`/wyceny/${quoteId}`);
}

export async function deleteModule(quoteId: string, openingId: string, moduleId: string) {
  await db.quoteModule.delete({ where: { id: moduleId } });
  await recalculateOpeningRail(openingId);
  revalidatePath(`/wyceny/${quoteId}`);
}

/** Czysto wizualne nadpisanie wymiarów pokazywanych w podglądzie/PDF - nie
 * przelicza ceny ani nie zmienia rzeczywistego (actual) wymiaru budowy.
 * Puste pole = usunięcie nadpisania (wraca do wymiaru rzeczywistego). */
export async function updateModuleDisplayDimensions(
  quoteId: string,
  moduleId: string,
  formData: FormData,
) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  const parseOrNull = (raw: string) => {
    if (!raw) return null;
    const n = Number(raw.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  await db.quoteModule.update({
    where: { id: moduleId },
    data: {
      displayWidthCm: parseOrNull(get("displayWidthCm")),
      displayHeightCm: parseOrNull(get("displayHeightCm")),
    },
  });

  revalidatePath(`/wyceny/${quoteId}`);
}
