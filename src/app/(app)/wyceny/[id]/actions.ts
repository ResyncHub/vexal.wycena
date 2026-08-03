"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/decimal";
import { computeModuleCost, computeOpeningSlidingRailCost, PricingError } from "@/lib/pricing/engine";
import { loadPriceCatalog } from "@/lib/pricing/catalog";
import { recalculateOpeningRail, recalculateQuoteTotals } from "@/lib/pricing/quote-totals";
import type {
  LamelaFinish,
  LamelaOrientation,
  ModuleType,
  OkucieMaterial,
} from "@/lib/pricing/types";

export interface ActionState {
  error: string | null;
}

export async function updateQuoteHeader(quoteId: string, formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  const validUntilRaw = get("validUntil");

  await db.quote.update({
    where: { id: quoteId },
    data: {
      clientName: get("clientName") || null,
      clientNip: get("clientNip") || null,
      clientAddress: get("clientAddress") || null,
      clientEmail: get("clientEmail") || null,
      clientPhone: get("clientPhone") || null,
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

/** Zwraca komunikat błędu zamiast rzucać wyjątek, żeby walidacja (np. zbyt
 * duży wymiar) trafiała do użytkownika także na produkcji - Next.js chowa
 * treść nieobsłużonych wyjątków w buildach produkcyjnych. */
export async function addOpening(
  quoteId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const label = String(formData.get("label") ?? "").trim() || "Otwór";
  const widthCm = Number(String(formData.get("widthCm") ?? "").replace(",", "."));
  const heightCm = Number(String(formData.get("heightCm") ?? "").replace(",", "."));

  try {
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
    return { error: null };
  } catch (error) {
    if (error instanceof PricingError) return { error: error.message };
    throw error;
  }
}

export async function deleteOpening(quoteId: string, openingId: string) {
  await db.quoteOpening.delete({ where: { id: openingId } });
  await recalculateQuoteTotals(quoteId);
  revalidatePath(`/wyceny/${quoteId}`);
}

export async function addModule(
  quoteId: string,
  openingId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  const type = get("type") as ModuleType;
  const widthCm = Number(get("widthCm").replace(",", "."));
  const heightCm = Number(get("heightCm").replace(",", "."));
  const orientation = get("orientation") as LamelaOrientation;
  const finish = get("finish") as LamelaFinish;
  const okucieMaterial = get("okucieMaterial") as OkucieMaterial;
  const ralColor = get("ralColor") || null;

  try {
    const catalog = await loadPriceCatalog();
    const result = computeModuleCost(
      { type, widthCm, heightCm, orientation, finish, okucieMaterial },
      catalog,
    );

    if (type === "JEZDNY") {
      // Sprawdź z wyprzedzeniem, czy wspólna szyna/prowadnica dla całego
      // otworu w ogóle mieści się w cenniku, zanim cokolwiek zapiszemy -
      // unika częściowego stanu (moduł zapisany, szyna nie do policzenia).
      const opening = await db.quoteOpening.findUniqueOrThrow({ where: { id: openingId } });
      computeOpeningSlidingRailCost(toNumber(opening.widthCm), catalog);
    }

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
    return { error: null };
  } catch (error) {
    if (error instanceof PricingError) return { error: error.message };
    throw error;
  }
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
