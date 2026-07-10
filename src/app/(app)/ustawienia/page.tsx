import { db } from "@/lib/db";
import { toNumber } from "@/lib/decimal";
import { updateCompanySettings } from "./actions";

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  textarea = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-neutral-700">
        {label}
      </label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue ?? ""}
          rows={4}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
        />
      )}
    </div>
  );
}

export default async function UstawieniaPage() {
  const settings = await db.companySettings.findUnique({ where: { id: "singleton" } });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-neutral-900">Ustawienia firmy</h1>
      <p className="mt-1 text-neutral-600">
        Dane widoczne na wycenach PDF oraz domyślne wartości narzutu i montażu.
      </p>

      <form
        action={updateCompanySettings}
        className="mt-6 max-w-2xl space-y-6 rounded-lg border border-neutral-200 bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nazwa firmy" name="name" defaultValue={settings?.name} />
          <Field label="NIP" name="nip" defaultValue={settings?.nip} />
          <Field label="Adres" name="address" defaultValue={settings?.address} />
          <Field label="Telefon" name="phone" defaultValue={settings?.phone} />
          <Field label="E-mail" name="email" type="email" defaultValue={settings?.email} />
          <Field label="Numer konta bankowego" name="bankAccount" defaultValue={settings?.bankAccount} />
          <Field label="URL logo (link do obrazka)" name="logoUrl" defaultValue={settings?.logoUrl} />
          <Field label="Prefiks numeru wyceny" name="quoteNumberPrefix" defaultValue={settings?.quoteNumberPrefix} />
        </div>

        <Field
          label="Warunki / stopka na PDF"
          name="footerTerms"
          textarea
          defaultValue={settings?.footerTerms}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Ważność oferty (dni)"
            name="quoteValidityDays"
            type="number"
            defaultValue={settings?.quoteValidityDays ?? 14}
          />
          <Field
            label="Domyślny narzut (%)"
            name="defaultMarkupPercent"
            defaultValue={settings ? toNumber(settings.defaultMarkupPercent) : 0}
          />
          <Field
            label="Domyślny koszt montażu (zł)"
            name="defaultInstallationPln"
            defaultValue={settings ? toNumber(settings.defaultInstallationPln) : 0}
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Zapisz ustawienia
        </button>
      </form>
    </div>
  );
}
