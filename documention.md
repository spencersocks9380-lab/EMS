# EMS Code Documentation

This file is the canonical codebase documentation for the current EMS implementation.

Rule for future changes:

- Any structural change to routes, components, actions, database design, auth flow, or setup commands must be reflected in this file in the same change set.

## 1. Project Overview

This repository contains a Next.js-based Event Management System with:

- a student-facing portal at `/`
- an admin-facing console at `/admin`
- local SQLite persistence using Node's built-in `node:sqlite`
- signed session cookies for student login
- seeded demo data for local development

The frontend now uses the cloned UI kit's component stack:

- `@chakra-ui/react`
- `@saas-ui/react`

## 2. Tech Stack

- Framework: `Next.js 16`
- Language: `TypeScript`
- UI: `React 19`, `Chakra UI`, `Saas UI`
- Styling support: `Tailwind CSS 4` is still present for globals/imports, but the main screens are built with Chakra/Saas UI components
- Database: `SQLite` via `node:sqlite`
- Runtime: `Node.js 22`

## 3. Main User Flows

### Student flow

Students can:

- open `/`
- log in using registration number and password
- view their profile summary
- view their applications
- view their scores
- browse open events
- register for an event

### Admin flow

Admins can:

- open `/admin`
- create events
- review event listings
- see incoming applications
- validate score drafts
- lock reviewed scores

## 4. Routes

### `/`

File:

- [app/page.tsx](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/app/page.tsx)

Purpose:

- server entry for the student portal
- reads the signed session cookie
- fetches data using `getHomeData`
- passes plain props into the client UI component

Rendered client UI:

- [app/components/home-screen.tsx](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/app/components/home-screen.tsx)

### `/admin`

File:

- [app/admin/page.tsx](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/app/admin/page.tsx)

Purpose:

- server entry for the admin console
- fetches admin dashboard data using `getAdminDashboard`
- passes plain props into the client UI component

Rendered client UI:

- [app/components/admin-screen.tsx](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/app/components/admin-screen.tsx)

## 5. Layout and Providers

### Root layout

File:

- [app/layout.tsx](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/app/layout.tsx)

Responsibilities:

- imports global CSS
- sets metadata
- wraps the app in `Providers`

### UI provider

File:

- [app/providers.tsx](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/app/providers.tsx)

Responsibilities:

- wraps the app in `SaasProvider`
- enables Chakra/Saas UI components across the app

### Global styling

File:

- [app/globals.css](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/app/globals.css)

Responsibilities:

- imports Tailwind
- defines base color variables
- sets the global background and selection styling

## 6. Frontend Component Architecture

### Student screen

File:

- [app/components/home-screen.tsx](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/app/components/home-screen.tsx)

Major sections:

- top navigation with Saas UI `Navbar`
- hero card
- student login/profile card
- stat cards
- notification banner
- leaderboard card
- student activity card
- event catalog card grid

Primary component libraries used:

- `AppShell`
- `Navbar`
- `Banner`
- `StructuredList`
- `PropertyList`
- Chakra `Card`, `Button`, `Input`, `Badge`, `Stat`, `SimpleGrid`, `Stack`

### Admin screen

File:

- [app/components/admin-screen.tsx](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/app/components/admin-screen.tsx)

Major sections:

- top navigation with Saas UI `Navbar`
- admin hero card
- stat cards
- notification banner
- event creation form
- current event list
- application list
- score review queue

Primary component libraries used:

- `AppShell`
- `Navbar`
- `Banner`
- `StructuredList`
- Chakra `Card`, `Button`, `Input`, `Textarea`, `Select`, `Badge`, `Stat`, `SimpleGrid`, `Stack`

## 7. Server Actions

File:

- [app/actions.ts](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/app/actions.ts)

### `loginStudent(formData)`

Responsibilities:

- reads `registrationNumber`
- reads `phoneNumber`
- authenticates the student via `authenticateStudent`
- creates a signed cookie using `createSessionToken`
- redirects to `/`

### `logoutStudent()`

Responsibilities:

- deletes the session cookie
- redirects to `/`

### `applyToEvent(formData)`

Responsibilities:

- reads the signed session cookie
- verifies the registration number from the cookie
- reads `eventId` and optional `teamName`
- creates the application via `createApplicationForStudent`
- revalidates `/`
- redirects with success/error query params

### `createEventAction(formData)`

Responsibilities:

- reads the admin form values
- creates the event via `createEvent`
- revalidates `/` and `/admin`
- redirects with status params

### `validateScoreDraft(formData)`

Responsibilities:

- reads `draftId`
- validates the score via `validateScoreDraftById`
- revalidates `/` and `/admin`

### `lockScoreDraft(formData)`

Responsibilities:

- reads `draftId`
- locks the score via `lockScoreDraftById`
- revalidates `/` and `/admin`

## 8. Authentication and Session Design

File:

- [lib/auth.ts](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/lib/auth.ts)

### Session model

The app uses a signed cookie, not JWT and not server-stored sessions.

Token format:

- `registrationNumber.signature`

How it works:

- `createSessionToken` signs the registration number using `HMAC-SHA256`
- `readSessionRegistrationNumber` verifies the signature with `timingSafeEqual`

Configuration:

- secret source: `EMS_SESSION_SECRET`
- fallback development secret exists in code for local use

Current cookie settings in `loginStudent`:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: false`
- `path: "/"`
- `maxAge: 12 hours`

## 9. Database Layer

File:

- [lib/db.ts](/c:/Users/lamsa/Desktop/Event%20Management/ui-kit/lib/db.ts)

This file contains:

- schema initialization
- database seeding
- authentication queries
- student dashboard queries
- admin dashboard queries
- application creation
- event creation
- score validation and locking

### Database file location

Generated at runtime:

- `data/ems.sqlite`

This file is intentionally ignored in git via `.gitignore`.

### Database lifecycle

- on first database access, `getDatabase()` opens `data/ems.sqlite`
- `initializeSchema()` creates the schema if missing
- `seedDatabase()` inserts demo data only when the database has no students

## 10. Database Schema

### `students`

Columns:

- `id`
- `name`
- `registration_number`
- `semester`
- `email`
- `phone_hash`
- `phone_salt`
- `created_at`

Purpose:

- stores student accounts
- stores password material as hash + salt

### `judges`

Columns:

- `id`
- `name`
- `expertise`
- `approved`

Purpose:

- stores judges available for events

### `events`

Columns:

- `id`
- `name`
- `description`
- `event_type`
- `team_size`
- `max_participants`
- `status`
- `start_at`
- `end_at`
- `rule_summary`
- `created_at`

Purpose:

- stores event-level metadata

### `rubric_metrics`

Columns:

- `id`
- `event_id`
- `metric_order`
- `name`
- `weight`

Purpose:

- stores five rubric metrics per event

### `advancement_rules`

Columns:

- `id`
- `event_id`
- `rule_text`

Purpose:

- stores per-event advancement rules

Note:

- These are currently persisted in the data model, but not exposed in the main UI after the refactor.

### `event_judges`

Columns:

- `id`
- `event_id`
- `judge_id`

Purpose:

- maps judges to events

### `applications`

Columns:

- `id`
- `student_id`
- `event_id`
- `status`
- `team_name`
- `applied_at`

Purpose:

- stores registrations submitted by students

### `score_drafts`

Columns:

- `id`
- `event_id`
- `student_id`
- `judge_id`
- `round_name`
- `metric_1`
- `metric_2`
- `metric_3`
- `metric_4`
- `metric_5`
- `weighted_total`
- `status`
- `admin_notes`
- `validated_at`
- `created_at`

Purpose:

- stores score submissions and their review status

## 11. Seed Data

### Seeded student accounts

The seeded student data includes:

- `Nikchaya Lamsal`
- `Aakriti Sharma`
- `Rohan Gurung`
- `Priya Karki`

Main seeded login:

- Registration number: `202300302`
- Password source value: `8436715819`

### Seeded judges

- `Sandeep Maharjan`
- `Aastha Bhandari`
- `Prabin Oli`

### Seeded events

- `Solo UI Challenge`
- `Innovation Sprint`
- `Robo Relay`

### Seeded applications and scores

The database is pre-seeded with:

- sample student registrations
- draft / validated / locked / disqualified scores

This makes the portal usable immediately in local development.

## 12. Data Returned to the UI

### `getHomeData(registrationNumber)`

Returns:

- `stats`
- `student`
- `events`
- `leaderboard`
- `studentApplications`
- `studentScores`

Important note:

- values returned to client components must be plain serializable objects
- query rows from `node:sqlite` should be normalized before crossing the server/client boundary

This was already handled for `rubricMetrics` after a runtime serialization error.

### `getAdminDashboard()`

Returns:

- `stats`
- `events`
- `applications`
- `validationQueue`

## 13. Business Logic Rules Implemented in Code

### Login

- students log in using registration number + password
- password verification is done using `scryptSync`

### Event registration

- duplicate active registration to the same event is blocked
- time overlap with another active event registration is blocked
- if an event is full, new applications are marked `waitlisted`
- team events accept an optional `teamName`
- individual events ignore `teamName`

### Event creation

- event type can be `individual` or `team`
- team events enforce minimum team size `2`
- individual events use team size `1`
- new events automatically receive default rubric metrics
- new events automatically receive one starter advancement rule

### Score review

- score drafts can move from `draft` to `validated`
- draft or validated scores can move to `locked`

## 14. File Structure

Current structure:

```text
app/
  actions.ts
  admin/
    page.tsx
  components/
    admin-screen.tsx
    home-screen.tsx
  globals.css
  layout.tsx
  page.tsx
  providers.tsx
lib/
  auth.ts
  db.ts
public/
  globe.svg
README.md
documention.md
```

Generated locally at runtime:

```text
data/
  ems.sqlite
```

## 15. Commands

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production build

```bash
npm run build
```

### Start production server

```bash
npm run start
```

### Lint

```bash
npm run lint
```

## 16. Local Run Instructions

From PowerShell:

```powershell
cd "C:\Users\lamsa\Desktop\Event Management\ui-kit"
npm install
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/admin`

## 17. Known Constraints

- `node:sqlite` is experimental in Node 22 and emits warnings during build/runtime
- current session handling is suitable for local/demo usage, not hardened production auth
- event rules and advancement rules are stored in the database but are not surfaced heavily in the current UI
- admin authentication is not implemented yet; `/admin` is currently open

## 18. Documentation Maintenance Requirement

This file must be updated whenever any of the following changes:

- route structure
- page/component structure
- provider/layout design
- server actions
- auth/session design
- database schema
- seed data strategy
- setup/run commands
- business rules implemented in code
- file/folder layout

If a future change alters the architecture and this file is not updated, the documentation is considered out of date.
