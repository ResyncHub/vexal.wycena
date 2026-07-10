import Link from "next/link";
import { db } from "@/lib/db";
import { createClient, deleteClient } from "./actions";

export default async function KlienciPage() {
  const clients = await db.client.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Klienci</h1>
        <p className="mt-1 text-neutral-600">Baza klientów do przypisywania w wycenach.</p>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Nazwa</th>
              <th className="px-3 py-2 font-medium">NIP</th>
              <th className="px-3 py-2 font-medium">Kontakt</th>
              <th className="px-3 py-2 font-medium">Adres</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-neutral-400">
                  Brak klientów. Dodaj pierwszego poniżej.
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="border-t border-neutral-100">
                <td className="px-3 py-2 text-neutral-800">
                  {c.name} {c.isCompany && <span className="text-neutral-400">(firma)</span>}
                </td>
                <td className="px-3 py-2 text-neutral-600">{c.nip ?? "—"}</td>
                <td className="px-3 py-2 text-neutral-600">
                  {[c.email, c.phone].filter(Boolean).join(" · ") || "—"}
                </td>
                <td className="px-3 py-2 text-neutral-600">{c.address ?? "—"}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/klienci/${c.id}`} className="text-neutral-600 hover:underline">
                      Edytuj
                    </Link>
                    <form action={deleteClient}>
                      <input type="hidden" name="id" value={c.id} />
                      <button type="submit" className="text-red-600 hover:underline">
                        Usuń
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="max-w-xl rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Nowy klient</h2>
        <form action={createClient} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Nazwa / imię i nazwisko</label>
              <input
                name="name"
                required
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">NIP</label>
              <input
                name="nip"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">E-mail</label>
              <input
                name="email"
                type="email"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Telefon</label>
              <input
                name="phone"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Adres</label>
            <input
              name="address"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name="isCompany" className="rounded border-neutral-300" />
            Klient firmowy
          </label>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Dodaj klienta
          </button>
        </form>
      </div>
    </div>
  );
}
