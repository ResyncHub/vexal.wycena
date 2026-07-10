"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { generateQuoteNumber } from "@/lib/quote-number";
import { recalculateOpeningRail, recalculateQuoteTotals } from "@/lib/pricing/quote-totals";

export async function createQuote() {
  const number = await generateQuoteNumber();
  const settings = await db.companySettings.findUnique({ where: { id: "singleton" } });
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (settings?.quoteValidityDays ?? 14));

  const quote = await db.quote.create({
    data: { number, validUntil },
  });

  redirect(`/wyceny/${quote.id}`);
}

export async function duplicateQuote(formData: FormData) {
  const sourceId = String(formData.get("id") ?? "");
  const source = await db.quote.findUniqueOrThrow({
    where: { id: sourceId },
    include: { openings: { include: { modules: true } } },
  });

  const number = await generateQuoteNumber();
  const settings = await db.companySettings.findUnique({ where: { id: "singleton" } });
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + (settings?.quoteValidityDays ?? 14));

  const newQuote = await db.quote.create({
    data: {
      number,
      validUntil,
      clientId: source.clientId,
      discountPercent: source.discountPercent,
      installationPln: source.installationPln,
      notes: source.notes,
    },
  });

  for (const opening of source.openings) {
    const newOpening = await db.quoteOpening.create({
      data: {
        quoteId: newQuote.id,
        label: opening.label,
        widthCm: opening.widthCm,
        position: opening.position,
      },
    });

    for (const m of opening.modules) {
      await db.quoteModule.create({
        data: {
          openingId: newOpening.id,
          position: m.position,
          type: m.type,
          widthCm: m.widthCm,
          heightCm: m.heightCm,
          orientation: m.orientation,
          finish: m.finish,
          ralColor: m.ralColor,
          okucieMaterial: m.okucieMaterial,
          lamelCount: m.lamelCount,
          lamelLengthCm: m.lamelLengthCm,
          uchwytSets: m.uchwytSets,
          frameWidthProfileLengthCm: m.frameWidthProfileLengthCm,
          frameHeightProfileLengthCm: m.frameHeightProfileLengthCm,
          costBreakdownJson: m.costBreakdownJson as object,
          costNetPln: m.costNetPln,
        },
      });
    }

    await recalculateOpeningRail(newOpening.id);
  }

  await recalculateQuoteTotals(newQuote.id);
  revalidatePath("/");
  redirect(`/wyceny/${newQuote.id}`);
}
