import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/decimal";
import {
  addModule,
  addOpening,
  deleteModule,
  deleteOpening,
  updateQuoteHeader,
} from "./actions";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Szkic" },
  { value: "SENT", label: "Wysłana" },
  { value: "ACCEPTED", label: "Zaakceptowana" },
  { value: "REJECTED", label: "Odrzucona" },
];

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

function fmt(n: number) {
  return n.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface CostBreakdownLine {
  label: string;
  quantity: number;
  unitPriceNetPln: number;
  totalNetPln: number;
}

function parseCostBreakdown(json: unknown): CostBreakdownLine[] {
  if (!Array.isArray(json)) return [];
  return json as CostBreakdownLine[];
}

function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const clients = await db.client.findMany({ orderBy: { name: "asc" } });

  const boundUpdateHeader = updateQuoteHeader.bind(null, quote.id);
  const boundAddOpening = addOpening.bind(null, quote.id);
  const boundDeleteOpening = deleteOpening.bind(null, quote.id);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{quote.number}</h1>
          <p className="mt-1 text-neutral-600">
            Utworzono {quote.createdAt.toLocaleDateString("pl-PL")}
          </p>
        </div>
        <Link
          href={`/wyceny/${quote.id}/pdf`}
          target="_blank"
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          Pobierz PDF
        </Link>
      </div>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Dane wyceny</h2>
        <form action={boundUpdateHeader} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Klient</label>
            <select
              name="clientId"
              defaultValue={quote.clientId ?? ""}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">— brak —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Status</label>
            <select
              name="status"
              defaultValue={quote.status}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Ważna do</label>
            <input
              type="date"
              name="validUntil"
              defaultValue={toDateInputValue(quote.validUntil)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Rabat (%)</label>
            <input
              name="discountPercent"
              defaultValue={toNumber(quote.discountPercent)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Montaż (zł)</label>
            <input
              name="installationPln"
              defaultValue={toNumber(quote.installationPln)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <label className="mb-1 block text-sm font-medium text-neutral-700">Notatki</label>
            <textarea
              name="notes"
              defaultValue={quote.notes ?? ""}
              rows={2}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Zapisz
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-neutral-900">Otwory i moduły</h2>

        {quote.openings.map((opening) => {
          const boundAddModule = addModule.bind(null, quote.id, opening.id);
          const boundDeleteModule = deleteModule.bind(null, quote.id, opening.id);
          const hasSliding = opening.modules.some((m) => m.type === "JEZDNY");

          return (
            <div key={opening.id} className="rounded-lg border border-neutral-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-neutral-900">
                    {opening.label}{" "}
                    <span className="text-neutral-400">
                      · otwór {toNumber(opening.widthCm)}×{toNumber(opening.heightCm)} cm
                    </span>
                  </h3>
                </div>
                <form action={boundDeleteOpening.bind(null, opening.id)}>
                  <button type="submit" className="text-sm text-red-600 hover:underline">
                    Usuń otwór
                  </button>
                </form>
              </div>

              {hasSliding && (
                <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 p-3">
                  <p className="mb-1.5 text-xs font-medium uppercase text-blue-700">
                    Wspólne dla otworu (jeden komplet na cały otwór, niezależnie od liczby modułów jezdnych)
                  </p>
                  <table className="w-full max-w-lg text-xs">
                    <tbody>
                      {parseCostBreakdown(opening.railBreakdownJson).map((line, i) => (
                        <tr key={i}>
                          <td className="py-0.5 pr-3 text-neutral-600">{line.label}</td>
                          <td className="py-0.5 pr-3 text-neutral-600">
                            {line.quantity}× {fmt(line.unitPriceNetPln)} zł
                          </td>
                          <td className="py-0.5 text-right text-neutral-700">
                            {fmt(line.totalNetPln)} zł netto
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t border-blue-200 font-medium">
                        <td className="py-0.5 pr-3 text-neutral-800" colSpan={2}>
                          Razem netto (szyna + prowadnica)
                        </td>
                        <td className="py-0.5 text-right text-neutral-900">
                          {fmt(toNumber(opening.slidingRailCostNetPln))} zł
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {opening.modules.length > 0 && (
                <table className="mb-4 w-full text-sm">
                  <thead className="text-left text-neutral-500">
                    <tr>
                      <th className="py-1.5 font-medium">Typ</th>
                      <th className="py-1.5 font-medium">Wymiary</th>
                      <th className="py-1.5 font-medium">Orientacja</th>
                      <th className="py-1.5 font-medium">Wykończenie</th>
                      <th className="py-1.5 font-medium">Lamele</th>
                      <th className="py-1.5 font-medium">Okucia</th>
                      <th className="py-1.5 font-medium">Koszt netto</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {opening.modules.map((m) => {
                      const breakdown = parseCostBreakdown(m.costBreakdownJson);
                      return (
                        <Fragment key={m.id}>
                          <tr className="border-t border-neutral-100">
                            <td className="py-1.5 text-neutral-700">
                              {m.type === "JEZDNY" ? "Jezdny" : "Stały"}
                            </td>
                            <td className="py-1.5 text-neutral-700">
                              {toNumber(m.actualWidthCm)}×{toNumber(m.actualHeightCm)} cm
                              {(toNumber(m.actualWidthCm) !== toNumber(m.widthCm) ||
                                toNumber(m.actualHeightCm) !== toNumber(m.heightCm)) && (
                                <div className="text-xs text-neutral-400">
                                  otwór {toNumber(m.widthCm)}×{toNumber(m.heightCm)} cm
                                  {toNumber(m.actualWidthCm) !== toNumber(m.widthCm) &&
                                    ` · o ${fmt(toNumber(m.widthCm) - toNumber(m.actualWidthCm))} cm węższy`}
                                  {toNumber(m.actualHeightCm) !== toNumber(m.heightCm) &&
                                    ` · o ${fmt(toNumber(m.heightCm) - toNumber(m.actualHeightCm))} cm niższy`}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 text-neutral-700">
                              {m.orientation === "POZIOMO" ? "poziome" : "pionowe"}
                            </td>
                            <td className="py-1.5 text-neutral-700">
                              {m.finish === "MALOWANA_RAL" ? "RAL" : "drewnopodobna"}
                              {m.ralColor ? ` (${m.ralColor})` : ""}
                            </td>
                            <td className="py-1.5 text-neutral-700">
                              {m.lamelCount}× {m.lamelLengthCm} cm
                            </td>
                            <td className="py-1.5 text-neutral-700">
                              {m.uchwytSets}× {m.okucieMaterial === "ALUMINIOWE" ? "alu" : "plastik"}
                            </td>
                            <td className="py-1.5 font-medium text-neutral-900">
                              {fmt(toNumber(m.costNetPln))} zł
                            </td>
                            <td className="py-1.5 text-right">
                              <form action={boundDeleteModule.bind(null, m.id)}>
                                <button type="submit" className="text-red-600 hover:underline">
                                  Usuń
                                </button>
                              </form>
                            </td>
                          </tr>
                          {breakdown.length > 0 && (
                            <tr className="bg-neutral-50">
                              <td></td>
                              <td colSpan={7} className="py-2">
                                <table className="w-full max-w-lg text-xs">
                                  <tbody>
                                    {breakdown.map((line, i) => (
                                      <tr key={i}>
                                        <td className="py-0.5 pr-3 text-neutral-500">{line.label}</td>
                                        <td className="py-0.5 pr-3 text-neutral-500">
                                          {line.quantity}× {fmt(line.unitPriceNetPln)} zł
                                        </td>
                                        <td className="py-0.5 text-right text-neutral-600">
                                          {fmt(line.totalNetPln)} zł netto
                                        </td>
                                      </tr>
                                    ))}
                                    <tr className="border-t border-neutral-200 font-medium">
                                      <td className="py-0.5 pr-3 text-neutral-700" colSpan={2}>
                                        Razem netto (koszt dostawcy)
                                      </td>
                                      <td className="py-0.5 text-right text-neutral-800">
                                        {fmt(toNumber(m.costNetPln))} zł
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}

              <details className="rounded-md border border-neutral-200 p-3">
                <summary className="cursor-pointer text-sm font-medium text-neutral-700">
                  + Dodaj moduł
                </summary>
                <p className="mt-2 text-xs text-neutral-500">
                  Podaj wymiary otworu do zabudowy. Lamela ma sztywną wysokość, więc gotowy moduł
                  może wyjść nieco mniejszy niż otwór (nigdy większy) — dokładny rozmiar zobaczysz
                  po dodaniu.
                </p>
                <form action={boundAddModule} className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                      defaultValue={toNumber(opening.widthCm)}
                      className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Wysokość (cm)</label>
                    <input
                      name="heightCm"
                      required
                      defaultValue={toNumber(opening.heightCm)}
                      className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Orientacja</label>
                    <select
                      name="orientation"
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
                    <select
                      name="finish"
                      className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                    >
                      {FINISH_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-neutral-600">Okucie</label>
                    <select
                      name="okucieMaterial"
                      className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                    >
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
                </form>
              </details>
            </div>
          );
        })}

        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6">
          <h3 className="mb-3 text-sm font-medium text-neutral-700">+ Dodaj otwór</h3>
          <form action={boundAddOpening} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Nazwa</label>
              <input
                name="label"
                placeholder="np. Otwór taras"
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Szerokość otworu (cm)
              </label>
              <input name="widthCm" required className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">
                Wysokość otworu (cm)
              </label>
              <input name="heightCm" required className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm" />
            </div>
            <button
              type="submit"
              className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Dodaj otwór
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Podsumowanie</h2>
        <dl className="grid max-w-sm gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-neutral-600">Koszt materiału (brutto)</dt>
            <dd className="text-neutral-900">{fmt(toNumber(quote.totalCostPln))} zł</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
            <dt className="text-neutral-900">Cena dla klienta</dt>
            <dd className="text-neutral-900">{fmt(toNumber(quote.totalPricePln))} zł</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
