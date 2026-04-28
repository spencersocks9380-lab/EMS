# EMS Campus Console

V1 event management system built on top of the cloned UI starter and adapted to your clarified workflow:

- participant login with `registration number + phone number`
- judge login with `username + access code`
- hashed and salted participant and judge credentials
- local SQL-backed seed data using Node's built-in `node:sqlite`
- event registration for individual and team events
- team roster capture for team registrations
- sub-event entry tracking for approved teams
- admin event creation with team-size control
- judge score drafts that must be admin-validated before lock

## Seeded Participant Login

- Name: `Nikchaya Lamsal`
- Registration Number: `202300302`
- Phone Number / V1 Password: `8436715819`

## Seeded Judge Logins

- `sandeep.judge` / `JUDGE1001`
- `aastha.judge` / `JUDGE1002`
- `prabin.judge` / `JUDGE1003`

## Routes

- `/` participant panel and public leaderboard
- `/judge` judge scoring and roster panel
- `/admin` admin event setup and score validation console

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS 4
- TypeScript
- Node.js 22
- SQLite via `node:sqlite`

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Project Structure

```text
app/
  actions.ts        Server actions for auth, registration, sub-events, and scoring
  admin/page.tsx    Admin console
  judge/page.tsx    Judge console
  globals.css       Tailwind and visual theme
  layout.tsx        Root layout
  page.tsx          Participant panel
lib/
  auth.ts           Signed session helper
  db.ts             SQLite schema, seed data, query helpers
data/
  ems.sqlite        Generated local database file on first run
```

## Notes

- The SQLite layer uses Node's experimental `node:sqlite` module in Node 22.
- This V1 keeps the login flow intentionally simple to match your college workflow, but the credentials are not stored in plain text.
- New events created from the admin console automatically get a default five-metric rubric and a starter advancement rule.
