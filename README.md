# Polish Vocab Studio

Next.js learning app for Polish vocabulary using MongoDB, Zustand, Tailwind, and simple auth.

## Quick start

```bash
npm install
cp .env.example .env
npm run seed
npm run dev
```

## Environment

```
MONGODB_URI=...
MONGODB_DB=polish_vocab
JWT_SECRET=change-me
```

## Data

Edit JSON files in `data/` or `legacy_backup_20260206/` and re-run `npm run seed`.

## Pages

- `/` landing page
- `/study` flashcard study mode
- `/deck` deck browser
- `/admin` dataset overview
- `/login` login + registration
- `/cabinet` protected user cabinet

## i18n

Language can be switched between Polish and Ukrainian with the top-right toggle. Locale is stored in the `locale` cookie.
