"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export async function createClient(formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  await db.client.create({
    data: {
      name: get("name"),
      isCompany: formData.get("isCompany") === "on",
      nip: get("nip") || null,
      address: get("address") || null,
      email: get("email") || null,
      phone: get("phone") || null,
      notes: get("notes") || null,
    },
  });

  revalidatePath("/klienci");
  redirect("/klienci");
}

export async function deleteClient(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.client.delete({ where: { id } });
  revalidatePath("/klienci");
}

export async function updateClient(clientId: string, formData: FormData) {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  await db.client.update({
    where: { id: clientId },
    data: {
      name: get("name"),
      isCompany: formData.get("isCompany") === "on",
      nip: get("nip") || null,
      address: get("address") || null,
      email: get("email") || null,
      phone: get("phone") || null,
      notes: get("notes") || null,
    },
  });

  revalidatePath("/klienci");
  redirect("/klienci");
}
