import Link from "next/link";
import { db } from "@/lib/db";
import { toNumber } from "@/lib/decimal";
import { createQuote, duplicateQuote } from "./wyceny/actions";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Szkic",
  SENT: "Wysłana",
  ACCEPTED: "Zaakceptowana",
  REJECTED: "Odrzucona",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-neutral-100 text-neutral-700",
  SENT: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
};

export default async function HomePage() {
  const quotes = await db.quote.findMany({
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Wyceny</h1>
          <p className="mt-1 text-neutral-600">Lista wszystkich wycen.</p>
        </div>
        <form action={createQuote}>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            + Nowa wycena
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Numer</th>
              <th className="px-3 py-2 font-medium">Klient</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Wartość</th>
              <th className="px-3 py-2 font-medium">Utworzono</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-neutral-400">
                  Brak wycen. Utwórz pierwszą powyżej.
                </td>
              </tr>
            )}
            {quotes.map((q) => (
              <tr key={q.id} className="border-t border-neutral-100">
                <td className="px-3 py-2">
                  <Link href={`/wyceny/${q.id}`} className="text-neutral-900 hover:underline">
                    {q.number}
                  </Link>
                </td>
                <td className="px-3 py-2 text-neutral-600">{q.client?.name ?? "—"}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[q.status]}`}
                  >
                    {STATUS_LABEL[q.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-neutral-800">
                  {toNumber(q.totalPricePln).toFixed(2)} zł
                </td>
                <td className="px-3 py-2 text-neutral-500">
                  {q.createdAt.toLocaleDateString("pl-PL")}
                </td>
                <td className="px-3 py-2 text-right">
                  <form action={duplicateQuote}>
                    <input type="hidden" name="id" value={q.id} />
                    <button type="submit" className="text-sm text-neutral-500 hover:underline">
                      Duplikuj
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
