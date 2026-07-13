import { notFound } from "next/navigation";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/decimal";
import { netToGrossCost, round2 } from "@/lib/pricing/engine";
import { QuoteDocument, type PdfOpening } from "@/lib/pdf/QuoteDocument";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      client: true,
      openings: {
        orderBy: { position: "asc" },
        include: { modules: { orderBy: { position: "asc" } } },
      },
    },
  });
  if (!quote) notFound();

  const company = await db.companySettings.findUnique({ where: { id: "singleton" } });
  const markupPercent = company ? toNumber(company.defaultMarkupPercent) : 0;

  const lineValue = (costNetPln: number) =>
    round2(netToGrossCost(costNetPln) * (1 + markupPercent / 100));

  let itemsSubtotalPln = 0;
  const openings: PdfOpening[] = quote.openings.map((opening) => {
    const modules = opening.modules.map((m) => {
      const valuePln = lineValue(toNumber(m.costNetPln));
      itemsSubtotalPln += valuePln;
      return {
        type: m.type,
        widthCm: toNumber(m.actualWidthCm),
        heightCm: toNumber(m.actualHeightCm),
        orientation: m.orientation,
        finish: m.finish,
        ralColor: m.ralColor,
        okucieMaterial: m.okucieMaterial,
        valuePln,
      };
    });

    const hasSliding = opening.modules.some((m) => m.type === "JEZDNY");
    const slidingRailValuePln = hasSliding
      ? lineValue(toNumber(opening.slidingRailCostNetPln))
      : null;
    if (slidingRailValuePln !== null) itemsSubtotalPln += slidingRailValuePln;

    return {
      label: opening.label,
      widthCm: toNumber(opening.widthCm),
      modules,
      slidingRailValuePln,
    };
  });

  const pdfBuffer = await renderToBuffer(
    QuoteDocument({
      company: {
        name: company?.name ?? "Twoja Firma",
        address: company?.address ?? null,
        nip: company?.nip ?? null,
        phone: company?.phone ?? null,
        email: company?.email ?? null,
        bankAccount: company?.bankAccount ?? null,
        logoUrl: company?.logoUrl ?? null,
        footerTerms: company?.footerTerms ?? null,
      },
      client: quote.client
        ? {
            name: quote.client.name,
            address: quote.client.address,
            nip: quote.client.nip,
            email: quote.client.email,
            phone: quote.client.phone,
          }
        : null,
      quote: {
        number: quote.number,
        createdAt: quote.createdAt,
        validUntil: quote.validUntil,
        discountPercent: toNumber(quote.discountPercent),
        installationPln: toNumber(quote.installationPln),
        notes: quote.notes,
        totalPricePln: toNumber(quote.totalPricePln),
      },
      openings,
      itemsSubtotalPln: round2(itemsSubtotalPln),
    }),
  );

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="wycena-${quote.number.replace(/\//g, "-")}.pdf"`,
    },
  });
}
