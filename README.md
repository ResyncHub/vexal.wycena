# Wyceny Lamele

Aplikacja do tworzenia automatycznych wycen lameli aluminiowych (shutters) w formacie PDF.

## Stack

- Next.js 16 (App Router, TypeScript), Tailwind CSS
- PostgreSQL + Prisma ORM
- Auth.js (NextAuth v5) — logowanie e-mail/hasło
- `@react-pdf/renderer` — generowanie PDF

## Uruchomienie lokalnie

1. Zainstaluj zależności:

   ```bash
   npm install
   ```

2. Skopiuj `.env.example` do `.env` i uzupełnij `DATABASE_URL` (lokalny Postgres) oraz `AUTH_SECRET`
   (np. `openssl rand -base64 32`).

3. Uruchom migracje i zasil bazę danymi z cennika:

   ```bash
   npx prisma migrate dev
   npm run db:seed
   ```

   Seed wypisze w konsoli e-mail i hasło do pierwszego logowania — **zmień hasło po pierwszym
   zalogowaniu** (edycja użytkownika w bazie, panel do zmiany hasła w UI nie jest jeszcze
   zbudowany).

4. Uruchom serwer developerski:

   ```bash
   npm run dev
   ```

## Testy

Silnik cenowy ma testy jednostkowe (walidują m.in. wyliczenie z benchmarku 140×220 cm):

```bash
npm test
```

## Cennik i logika wyceny

Ceny (netto od dostawcy) i tabele producenta edytujesz w panelu `/cennik` po zalogowaniu — nie
wymaga to zmian w kodzie. Firma nie jest płatnikiem VAT, więc kupuje materiał w cenach brutto
(netto × 1,23) i tak samo sprzedaje — logika ta jest zaszyta w `src/lib/pricing/engine.ts`.

Domyślny narzut (%) i koszt montażu ustawiasz w `/ustawienia`.

## Deploy (Vercel)

1. Załóż darmową bazę Postgres, np. na [Neon](https://neon.tech) lub [Supabase](https://supabase.com).
2. W ustawieniach projektu na Vercel dodaj zmienne środowiskowe `DATABASE_URL` i `AUTH_SECRET`.
3. Podłącz repozytorium do Vercel — `npm install` uruchomi automatycznie `prisma generate`
   (skrypt `postinstall`).
4. Po pierwszym deployu uruchom migracje i seed przeciw bazie produkcyjnej (lokalnie, wskazując
   produkcyjny `DATABASE_URL` w `.env`):

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

### Uwaga: logo firmy w PDF

Pole "URL logo" w `/ustawienia` musi wskazywać na publicznie dostępny obrazek (np. link do pliku
na Twojej stronie) — PDF generowany jest po stronie serwera i pobiera logo spod tego adresu.
