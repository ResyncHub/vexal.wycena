import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { updateClient } from "../actions";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await db.client.findUnique({ where: { id } });
  if (!client) notFound();

  const boundUpdate = updateClient.bind(null, client.id);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Edytuj klienta</h1>

      <form action={boundUpdate} className="mt-6 space-y-4 rounded-lg border border-neutral-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Nazwa / imię i nazwisko</label>
            <input
              name="name"
              required
              defaultValue={client.name}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">NIP</label>
            <input
              name="nip"
              defaultValue={client.nip ?? ""}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">E-mail</label>
            <input
              name="email"
              type="email"
              defaultValue={client.email ?? ""}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Telefon</label>
            <input
              name="phone"
              defaultValue={client.phone ?? ""}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Adres</label>
          <input
            name="address"
            defaultValue={client.address ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">Notatki</label>
          <textarea
            name="notes"
            defaultValue={client.notes ?? ""}
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            name="isCompany"
            defaultChecked={client.isCompany}
            className="rounded border-neutral-300"
          />
          Klient firmowy
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Zapisz zmiany
        </button>
      </form>
    </div>
  );
}
