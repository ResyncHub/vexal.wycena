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
  const markupPercent = toNumber(quote.markupPercent);

  const lineValue = (costNetPln: number) =>
    round2(netToGrossCost(costNetPln) * (1 + markupPercent / 100));

  let itemsSubtotalPln = 0;
  const openings: PdfOpening[] = quote.openings.map((opening) => {
    // System jezdny (szyna + prowadnica) jest wspólny dla całego otworu, ale
    // na wycenie klient ma widzieć JEDNĄ cenę za moduł - rozdzielamy więc ten
    // koszt równo między moduły jezdne w tym otworze zamiast pokazywać go
    // jako osobną pozycję.
    const slidingModules = opening.modules.filter((m) => m.type === "JEZDNY");
    const railValuePln =
      slidingModules.length > 0 ? lineValue(toNumber(opening.slidingRailCostNetPln)) : 0;
    const railSharePerModule = slidingModules.length > 0 ? railValuePln / slidingModules.length : 0;

    const modules = opening.modules.map((m) => {
      const isSliding = m.type === "JEZDNY";
      const valuePln = round2(lineValue(toNumber(m.costNetPln)) + (isSliding ? railSharePerModule : 0));
      itemsSubtotalPln += valuePln;
      return {
        type: m.type,
        widthCm: toNumber(m.displayWidthCm ?? m.actualWidthCm),
        heightCm: toNumber(m.displayHeightCm ?? m.actualHeightCm),
        orientation: m.orientation,
        finish: m.finish,
        ralColor: m.ralColor,
        okucieMaterial: m.okucieMaterial,
        valuePln,
        hasSlidingSystem: isSliding,
      };
    });

    return {
      label: opening.label,
      modules,
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
