"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function updateCompanySettings(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();
  const getNumber = (key: string, fallback: number) => {
    const raw = get(key).replace(",", ".");
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };

  await db.companySettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      name: get("name") || "Twoja Firma",
      address: get("address") || null,
      nip: get("nip") || null,
      phone: get("phone") || null,
      email: get("email") || null,
      bankAccount: get("bankAccount") || null,
      footerTerms: get("footerTerms") || null,
      quoteValidityDays: Math.round(getNumber("quoteValidityDays", 14)),
      defaultMarkupPercent: getNumber("defaultMarkupPercent", 0),
      defaultInstallationPln: getNumber("defaultInstallationPln", 0),
      quoteNumberPrefix: get("quoteNumberPrefix") || "WYC",
    },
    update: {
      name: get("name") || "Twoja Firma",
      address: get("address") || null,
      nip: get("nip") || null,
      phone: get("phone") || null,
      email: get("email") || null,
      bankAccount: get("bankAccount") || null,
      footerTerms: get("footerTerms") || null,
      quoteValidityDays: Math.round(getNumber("quoteValidityDays", 14)),
      defaultMarkupPercent: getNumber("defaultMarkupPercent", 0),
      defaultInstallationPln: getNumber("defaultInstallationPln", 0),
      quoteNumberPrefix: get("quoteNumberPrefix") || "WYC",
    },
  });

  revalidatePath("/ustawienia");
}
