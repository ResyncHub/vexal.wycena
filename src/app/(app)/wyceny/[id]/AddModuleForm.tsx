"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";
import { FINISH_OPTIONS, OKUCIE_OPTIONS, ORIENTATION_OPTIONS, TYPE_OPTIONS } from "./constants";

export function AddModuleForm({
  action,
  defaultWidthCm,
  defaultHeightCm,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultWidthCm: number;
  defaultHeightCm: number;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    error: null,
  });

  return (
    <details className="rounded-md border border-neutral-200 p-3">
      <summary className="cursor-pointer text-sm font-medium text-neutral-700">+ Dodaj moduł</summary>
      <p className="mt-2 text-xs text-neutral-500">
        Podaj wymiary otworu do zabudowy. Lamela ma sztywną wysokość, więc gotowy moduł może wyjść
        nieco mniejszy niż otwór (nigdy większy) — dokładny rozmiar zobaczysz po dodaniu.
      </p>
      {state.error && (
        <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <form action={formAction} className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
            defaultValue={defaultWidthCm}
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Wysokość (cm)</label>
          <input
            name="heightCm"
            required
            defaultValue={defaultHeightCm}
            className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Orientacja</label>
          <select name="orientation" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
            {ORIENTATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Wykończenie</label>
          <select name="finish" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
            {FINISH_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Okucie</label>
          <select name="okucieMaterial" className="w-full rounded-md border border-neutral-300 px-2 py-1.5 text-sm">
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
            disabled={isPending}
            className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {isPending ? "Dodawanie…" : "Dodaj moduł"}
          </button>
        </div>
      </form>
    </details>
  );
}
