"use client";

export default function QuoteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-red-900">Coś poszło nie tak</h2>
      <p className="mb-4 text-sm text-red-800">
        {error.message || "Wystąpił nieoczekiwany błąd. Sprawdź wpisane dane i spróbuj ponownie."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md bg-red-900 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
