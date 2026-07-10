import { db } from "@/lib/db";
import { toNumber } from "@/lib/decimal";
import {
  updateFixedPartPrices,
  updateLamelaPrices,
  updateOkuciePrices,
  updateProfilePrices,
} from "./actions";

const LAMELA_FINISH_LABEL: Record<string, string> = {
  MALOWANA_RAL: "Lamela malowana RAL",
  DREWNOPODOBNA: "Lamela drewnopodobna",
};

const PROFILE_TYPE_LABEL: Record<string, string> = {
  RAMA: "Profil aluminiowy do ramy",
  DRZWI_PRZESUWNE_GORNY: "Profil górny do drzwi przesuwnych",
  DRZWI_PRZESUWNE_DOLNY: "Profil dolny do drzwi przesuwnych",
};

const OKUCIE_MATERIAL_LABEL: Record<string, string> = {
  ALUMINIOWE: "Okucie aluminiowe (zestaw do 6 lameli)",
  PLASTIKOWE: "Okucie plastikowe (zestaw do 6 lameli)",
};

function PriceTable({
  rows,
  action,
}: {
  rows: { id: string; lengthLabel: string; priceNetPln: number }[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="rounded-lg border border-neutral-200 bg-white">
      <div className="max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Długość</th>
              <th className="px-3 py-2 font-medium">Cena netto (zł)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-neutral-100">
                <td className="px-3 py-1.5 text-neutral-700">{row.lengthLabel}</td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    name={`price-${row.id}`}
                    defaultValue={row.priceNetPln.toFixed(2)}
                    className="w-24 rounded border border-neutral-300 px-2 py-1 text-right focus:border-neutral-500 focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-neutral-200 px-3 py-2">
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Zapisz zmiany
        </button>
      </div>
    </form>
  );
}

export default async function CennikPage() {
  const [lamelaRows, profileRows, okucieRows, fixedRows] = await Promise.all([
    db.lamelaPriceTier.findMany({ orderBy: [{ finish: "asc" }, { lengthCm: "asc" }] }),
    db.profilePriceTier.findMany({ orderBy: [{ profileType: "asc" }, { lengthCm: "asc" }] }),
    db.okucieSetPrice.findMany({ orderBy: { material: "asc" } }),
    db.fixedPricePart.findMany({ orderBy: { code: "asc" } }),
  ]);

  const lamelaByFinish = groupBy(lamelaRows, (r) => r.finish);
  const profileByType = groupBy(profileRows, (r) => r.profileType);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Cennik</h1>
        <p className="mt-1 text-neutral-600">
          Ceny netto z cennika dostawcy. Koszt brutto (jaki faktycznie płacisz) to netto × 1,23.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Lamele</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(lamelaByFinish).map(([finish, rows]) => (
            <div key={finish}>
              <h3 className="mb-2 text-sm font-medium text-neutral-700">
                {LAMELA_FINISH_LABEL[finish] ?? finish}
              </h3>
              <PriceTable
                rows={rows.map((r) => ({
                  id: r.id,
                  lengthLabel: `${r.lengthCm} cm`,
                  priceNetPln: toNumber(r.priceNetPln),
                }))}
                action={updateLamelaPrices}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Profile</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(profileByType).map(([type, rows]) => (
            <div key={type}>
              <h3 className="mb-2 text-sm font-medium text-neutral-700">
                {PROFILE_TYPE_LABEL[type] ?? type}
              </h3>
              <PriceTable
                rows={rows.map((r) => ({
                  id: r.id,
                  lengthLabel: `${r.lengthCm} cm`,
                  priceNetPln: toNumber(r.priceNetPln),
                }))}
                action={updateProfilePrices}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Okucia (zestaw do 6 lameli)</h2>
        <div className="max-w-sm">
          <PriceTable
            rows={okucieRows.map((r) => ({
              id: r.id,
              lengthLabel: OKUCIE_MATERIAL_LABEL[r.material] ?? r.material,
              priceNetPln: toNumber(r.priceNetPln),
            }))}
            action={updateOkuciePrices}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Dodatki do modułu jezdnego
        </h2>
        <div className="max-w-sm">
          <PriceTable
            rows={fixedRows.map((r) => ({
              id: r.id,
              lengthLabel: r.label,
              priceNetPln: toNumber(r.priceNetPln),
            }))}
            action={updateFixedPartPrices}
          />
        </div>
      </section>
    </div>
  );
}

function groupBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyFn(item);
    (result[key] ??= []).push(item);
  }
  return result;
}
