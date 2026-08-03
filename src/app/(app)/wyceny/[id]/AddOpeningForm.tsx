"use client";

import { useActionState } from "react";
import type { ActionState } from "./actions";

export function AddOpeningForm({
  action,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, {
    error: null,
  });

  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6">
      <h3 className="mb-3 text-sm font-medium text-neutral-700">+ Dodaj otwór</h3>
      {state.error && (
        <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Nazwa</label>
          <input
            name="label"
            placeholder="np. Otwór taras"
            className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Szerokość otworu (cm)
          </label>
          <input name="widthCm" required className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">
            Wysokość otworu (cm)
          </label>
          <input name="heightCm" required className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm" />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {isPending ? "Dodawanie…" : "Dodaj otwór"}
        </button>
      </form>
    </div>
  );
}
