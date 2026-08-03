import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/decimal";
import { round2 } from "@/lib/pricing/engine";
import {
  addModule,
  addOpening,
  deleteModule,
  deleteOpening,
  updateModuleDisplayDimensions,
  updateQuoteHeader,
} from "./actions";
import { AddModuleForm } from "./AddModuleForm";
import { AddOpeningForm } from "./AddOpeningForm";
import { STATUS_OPTIONS, fmt } from "./constants";

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
      openings: {
        orderBy: { position: "asc" },
        include: { modules: { orderBy: { position: "asc" } } },
      },
    },
  });

  if (!quote) notFound();

  const boundUpdateHeader = updateQuoteHeader.bind(null, quote.id);
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
        <form action={boundUpdateHeader} className="space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-medium text-neutral-700">Dane klienta</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Nazwa / imię i nazwisko</label>
                <input
                  name="clientName"
                  defaultValue={quote.clientName ?? ""}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">Telefon</label>
                <input
                  name="clientPhone"
                  defaultValue={quote.clientPhone ?? ""}
                  placeholder="np. 600 700 800"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">E-mail</label>
                <input
                  name="clientEmail"
                  type="email"
                  defaultValue={quote.clientEmail ?? ""}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-neutral-600">NIP (opcjonalnie)</label>
                <input
                  name="clientNip"
                  defaultValue={quote.clientNip ?? ""}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4">
                <label className="mb-1 block text-xs font-medium text-neutral-600">Adres</label>
                <input
                  name="clientAddress"
                  defaultValue={quote.clientAddress ?? ""}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <label className="mb-1 block text-sm font-medium text-neutral-700">Marża (%)</label>
            <input
              name="markupPercent"
              defaultValue={toNumber(quote.markupPercent)}
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
          </div>
        </form>
      </section>

      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-neutral-900">Otwory i moduły</h2>

        {quote.openings.map((opening) => {
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
                      const boundUpdateDisplayDims = updateModuleDisplayDimensions.bind(
                        null,
                        quote.id,
                        m.id,
                      );
                      const hasDisplayOverride = m.displayWidthCm !== null || m.displayHeightCm !== null;
                      const shownWidthCm = toNumber(m.displayWidthCm ?? m.actualWidthCm);
                      const shownHeightCm = toNumber(m.displayHeightCm ?? m.actualHeightCm);
                      return (
                        <Fragment key={m.id}>
                          <tr className="border-t border-neutral-100">
                            <td className="py-1.5 text-neutral-700">
                              {m.type === "JEZDNY" ? "Jezdny" : "Stały"}
                            </td>
                            <td className="py-1.5 text-neutral-700">
                              {shownWidthCm}×{shownHeightCm} cm
                              {hasDisplayOverride ? (
                                <div className="text-xs text-amber-600">
                                  nadpisane do podglądu · rzeczywisty {toNumber(m.actualWidthCm)}×
                                  {toNumber(m.actualHeightCm)} cm
                                </div>
                              ) : (
                                (toNumber(m.actualWidthCm) !== toNumber(m.widthCm) ||
                                  toNumber(m.actualHeightCm) !== toNumber(m.heightCm)) && (
                                  <div className="text-xs text-neutral-400">
                                    otwór {toNumber(m.widthCm)}×{toNumber(m.heightCm)} cm
                                    {toNumber(m.actualWidthCm) !== toNumber(m.widthCm) &&
                                      ` · o ${fmt(toNumber(m.widthCm) - toNumber(m.actualWidthCm))} cm węższy`}
                                    {toNumber(m.actualHeightCm) !== toNumber(m.heightCm) &&
                                      ` · o ${fmt(toNumber(m.heightCm) - toNumber(m.actualHeightCm))} cm niższy`}
                                  </div>
                                )
                              )}
                              <details className="mt-1">
                                <summary className="cursor-pointer text-xs text-blue-600">
                                  Wymiary do podglądu
                                </summary>
                                <form
                                  action={boundUpdateDisplayDims}
                                  className="mt-1 flex flex-wrap items-center gap-1"
                                >
                                  <input
                                    name="displayWidthCm"
                                    defaultValue={m.displayWidthCm ? toNumber(m.displayWidthCm) : ""}
                                    placeholder="szer."
                                    className="w-16 rounded border border-neutral-300 px-1 py-0.5 text-xs"
                                  />
                                  <input
                                    name="displayHeightCm"
                                    defaultValue={m.displayHeightCm ? toNumber(m.displayHeightCm) : ""}
                                    placeholder="wys."
                                    className="w-16 rounded border border-neutral-300 px-1 py-0.5 text-xs"
                                  />
                                  <button type="submit" className="text-xs text-blue-600 underline">
                                    Zapisz
                                  </button>
                                </form>
                              </details>
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

              <AddModuleForm
                action={addModule.bind(null, quote.id, opening.id)}
                defaultWidthCm={toNumber(opening.widthCm)}
                defaultHeightCm={toNumber(opening.heightCm)}
              />
            </div>
          );
        })}

        <AddOpeningForm action={addOpening.bind(null, quote.id)} />
      </section>

      <section className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Podsumowanie</h2>
        {(() => {
          const costGrossPln = toNumber(quote.totalCostPln);
          const markupPercent = toNumber(quote.markupPercent);
          const withMarkup = round2(costGrossPln * (1 + markupPercent / 100));
          const installationPln = toNumber(quote.installationPln);
          const withInstallation = round2(withMarkup + installationPln);
          const discountPercent = toNumber(quote.discountPercent);

          return (
            <dl className="grid max-w-sm gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-600">Koszt materiału (brutto)</dt>
                <dd className="text-neutral-900">{fmt(costGrossPln)} zł</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Marża ({fmt(markupPercent)}%)</dt>
                <dd className="text-neutral-900">
                  {fmt(round2(withMarkup - costGrossPln))} zł
                </dd>
              </div>
              {installationPln > 0 && (
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Montaż</dt>
                  <dd className="text-neutral-900">{fmt(installationPln)} zł</dd>
                </div>
              )}
              {discountPercent > 0 && (
                <div className="flex justify-between">
                  <dt className="text-neutral-600">Rabat ({fmt(discountPercent)}%)</dt>
                  <dd className="text-neutral-900">
                    -{fmt(round2(withInstallation * (discountPercent / 100)))} zł
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
                <dt className="text-neutral-900">Cena dla klienta (brutto)</dt>
                <dd className="text-neutral-900">{fmt(toNumber(quote.totalPricePln))} zł</dd>
              </div>
            </dl>
          );
        })()}
      </section>
    </div>
  );
}
