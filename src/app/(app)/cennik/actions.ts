"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

function parseRowUpdates(formData: FormData): { id: string; price: number }[] {
  const updates: { id: string; price: number }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("price-")) continue;
    const id = key.slice("price-".length);
    const price = Number(String(value).replace(",", "."));
    if (Number.isFinite(price) && price >= 0) {
      updates.push({ id, price });
    }
  }
  return updates;
}

export async function updateLamelaPrices(formData: FormData) {
  const updates = parseRowUpdates(formData);
  await Promise.all(
    updates.map((u) =>
      db.lamelaPriceTier.update({
        where: { id: u.id },
        data: { priceNetPln: u.price },
      }),
    ),
  );
  revalidatePath("/cennik");
}

export async function updateProfilePrices(formData: FormData) {
  const updates = parseRowUpdates(formData);
  await Promise.all(
    updates.map((u) =>
      db.profilePriceTier.update({
        where: { id: u.id },
        data: { priceNetPln: u.price },
      }),
    ),
  );
  revalidatePath("/cennik");
}

export async function updateOkuciePrices(formData: FormData) {
  const updates = parseRowUpdates(formData);
  await Promise.all(
    updates.map((u) =>
      db.okucieSetPrice.update({
        where: { id: u.id },
        data: { priceNetPln: u.price },
      }),
    ),
  );
  revalidatePath("/cennik");
}

export async function updateFixedPartPrices(formData: FormData) {
  const updates = parseRowUpdates(formData);
  await Promise.all(
    updates.map((u) =>
      db.fixedPricePart.update({
        where: { id: u.id },
        data: { priceNetPln: u.price },
      }),
    ),
  );
  revalidatePath("/cennik");
}
