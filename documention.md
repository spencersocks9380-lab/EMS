# EMS Code Documentation

This file is the canonical codebase documentation for the current EMS implementation.

Rule for future changes:

- Any structural change to routes, components, actions, database design, auth flow, or setup commands must be reflected in this file in the same change set.

## 1. Project Overview

This repository contains a Next.js-based Event Management System with:

- a participant-facing panel at `/`
- a judge-facing panel at `/judge`
- an admin-facing console at `/admin`
- local SQLite persistence using Node's built-in `node:sqlite`
- signed session cookies with role-aware payloads
- seeded demo data for local development
- team roster storage for team events
- sub-event entry tracking for approved teams

The frontend uses the cloned UI kit's component stack:

- `@chakra-ui/react`
- `@saas-ui/react`

## 2. Tech Stack

- Framework: `Next.js 16`
- Language: `TypeScript`
- UI: `React 19`, `Chakra UI`, `Saas UI`
- Styling support: `Tailwind CSS 4` is still present for globals/imports, while the main screens are built with Chakra/Saas UI components
- Database: `SQLite` via `node:sqlite`
- Runtime: `Node.js 22`

## 3. Main User Flows

### Participant flow

Participants can:

- open `/`
- log in using registration number and password
- view their profile summary
- view their event applications
- see team names and participant rosters for team applications
- view their scores
- browse open events
- register for individual or team events
- enter approved team applications into sub-events

### Judge flow

Judges can:

- open `/judge`
- log in using judge username and access code
- see only the events assigned to them
- review approved participants and approved teams in those events
- see which teams entered sub-events and the participant names in each team
- submit or update score drafts for their assigned participants

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

- `app/page.tsx`

Purpose:

- server entry for the participant panel
- reads the signed session cookie
- resolves only participant-role sessions
- fetches data using `getHomeData`
- passes plain props into the client UI component

Rendered client UI:

- `app/components/home-screen.tsx`

### `/judge`

File:

- `app/judge/page.tsx`

Purpose:

- server entry for the judge panel
- reads the signed session cookie
- resolves only judge-role sessions
- fetches data using `getJudgeDashboard`
- passes plain props into the client UI component

Rendered client UI:

- `app/components/judge-screen.tsx`

### `/admin`

File:

- `app/admin/page.tsx`

Purpose:

- server entry for the admin console
- fetches admin dashboard data using `getAdminDashboard`
- passes plain props into the client UI component

Rendered client UI:

- `app/components/admin-screen.tsx`

## 5. Layout and Providers

### Root layout

File:

- `app/layout.tsx`

Responsibilities:

- imports global CSS
- sets metadata
- wraps the app in `Providers`

### UI provider

File:

- `app/providers.tsx`

Responsibilities:

- wraps the app in `SaasProvider`
- enables Chakra/Saas UI components across the app

### Global styling

File:

- `app/globals.css`

Responsibilities:

- imports Tailwind
- defines base color variables
- sets the global background and selection styling

## 6. Frontend Component Architecture

### Participant screen

File:

- `app/components/home-screen.tsx`

Major sections:

- top navigation with links to judge and admin panels
- participant hero card
- participant login/profile card
- stat cards
- notification banner
- leaderboard card
- participant activity card
- sub-event entry card grid
- event catalog card grid

Primary component libraries used:

- `AppShell`
- `Navbar`
- `Banner`
- `StructuredList`
- `PropertyList`
- Chakra `Card`, `Button`, `Input`, `Textarea`, `Badge`, `Stat`, `SimpleGrid`, `Stack`

### Judge screen

File:

- `app/components/judge-screen.tsx`

Major sections:

- top navigation with links to participant and admin panels
- judge hero card
- judge login/profile card
- stat cards
- notification banner
- assigned event list
- sub-event roster visibility list
- scoring queue with draft score forms

Primary component libraries used:

- `AppShell`
- `Navbar`
- `Banner`
- `StructuredList`
- Chakra `Card`, `Button`, `Input`, `Textarea`, `Badge`, `Stat`, `SimpleGrid`, `Stack`

### Admin screen

File:

- `app/components/admin-screen.tsx`

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

- `app/actions.ts`

### `loginParticipant(formData)`

Responsibilities:

- reads `registrationNumber`
- reads `phoneNumber`
- authenticates the participant via `authenticateStudent`
- creates a signed participant session cookie
- redirects to `/`

### `loginJudge(formData)`

Responsibilities:

- reads `username`
- reads `accessCode`
- authenticates the judge via `authenticateJudge`
- creates a signed judge session cookie
- redirects to `/judge`

### `logoutSession()`

Responsibilities:

- deletes the shared session cookie
- redirects to `/`

### `applyToEvent(formData)`

Responsibilities:

- reads the signed session cookie
- verifies the participant role and registration number from the cookie
- reads `eventId`, optional `teamName`, and optional `teamMembers`
- creates the application via `createApplicationForStudent`
- revalidates `/` and `/judge`
- redirects with success/error query params

### `enterSubEvent(formData)`

Responsibilities:

- reads the signed session cookie
- verifies the participant role and registration number from the cookie
- reads `subEventId`
- creates the sub-event entry via `enterParticipantTeamIntoSubEvent`
- revalidates `/` and `/judge`
- redirects with success/error query params

### `submitJudgeScore(formData)`

Responsibilities:

- reads the signed session cookie
- verifies the judge role and username from the cookie
- reads `applicationId`, `roundName`, metric values, and note text
- creates or updates the score draft via `submitJudgeScoreDraft`
- revalidates `/`, `/judge`, and `/admin`
- redirects with success/error query params

### `createEventAction(formData)`

Responsibilities:

- reads the admin form values
- creates the event via `createEvent`
- revalidates `/`, `/judge`, and `/admin`
- redirects with status params

### `validateScoreDraft(formData)`

Responsibilities:

- reads `draftId`
- validates the score via `validateScoreDraftById`
- revalidates `/`, `/judge`, and `/admin`

### `lockScoreDraft(formData)`

Responsibilities:

- reads `draftId`
- locks the score via `lockScoreDraftById`
- revalidates `/`, `/judge`, and `/admin`

## 8. Authentication and Session Design

File:

- `lib/auth.ts`

### Session model

The app uses a signed cookie, not JWT and not server-stored sessions.

Token format:

- `role:identifier.signature`

Current roles:

- `participant`
- `judge`

How it works:

- `createSessionToken` signs the `role:identifier` payload using `HMAC-SHA256`
- `readSessionIdentity` verifies the payload signature with `timingSafeEqual`
- `readSessionRegistrationNumber` only returns identifiers for `participant` sessions
- `readSessionJudgeUsername` only returns identifiers for `judge` sessions

Configuration:

- secret source: `EMS_SESSION_SECRET`
- fallback development secret exists in code for local use

Current cookie settings:

- `httpOnly: true`
- `sameSite: "lax"`
- `secure: false`
- `path: "/"`
- `maxAge: 12 hours`

## 9. Database Layer

File:

- `lib/db.ts`

This file contains:

- schema initialization
- migration helpers for legacy databases
- database seeding
- judge credential backfill
- team member backfill
- participant authentication queries
- judge authentication queries
- participant dashboard queries
- judge dashboard queries
- admin dashboard queries
- event application creation
- sub-event entry creation
- event creation
- judge draft scoring
- score validation and locking

### Database file location

Generated at runtime:

- `data/ems.sqlite`

This file is intentionally ignored in git via `.gitignore`.

### Database lifecycle

- on first database access, `getDatabase()` opens `data/ems.sqlite`
- `initializeSchema()` creates tables if missing
- `migrateSchema()` adds missing judge auth columns and supporting indexes
- `seedDatabase()` inserts demo data only when the database has no students
- `hydrateDatabase()` backfills judge credentials, team members, and default sub-events when needed

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

- stores participant accounts
- stores participant password material as hash + salt

### `judges`

Columns:

- `id`
- `name`
- `expertise`
- `approved`
- `username`
- `login_code_hash`
- `login_code_salt`

Purpose:

- stores judges available for events
- stores judge login identity and hashed access code material

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

- stores registrations submitted by participants

### `application_team_members`

Columns:

- `id`
- `application_id`
- `member_name`
- `member_registration_number`
- `is_captain`

Purpose:

- stores the visible participant roster for a team application

### `sub_events`

Columns:

- `id`
- `event_id`
- `name`
- `description`
- `start_at`
- `end_at`
- `status`
- `max_teams`
- `created_at`

Purpose:

- stores sub-events belonging to team events

### `sub_event_entries`

Columns:

- `id`
- `sub_event_id`
- `application_id`
- `entered_at`

Purpose:

- stores which approved team applications entered which sub-events

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

- stores judge score submissions and their review status

## 11. Seed Data

### Seeded participant accounts

The seeded participant data includes:

- `Nikchaya Lamsal`
- `Aakriti Sharma`
- `Rohan Gurung`
- `Priya Karki`

Main seeded participant login:

- Registration number: `202300302`
- Password source value: `8436715819`

### Seeded judges

- `Sandeep Maharjan`
- `Aastha Bhandari`
- `Prabin Oli`

Seeded judge credentials:

- `sandeep.judge` / `JUDGE1001`
- `aastha.judge` / `JUDGE1002`
- `prabin.judge` / `JUDGE1003`

### Seeded events

- `Solo UI Challenge`
- `Innovation Sprint`
- `Robo Relay`

### Seeded team rosters

The team-event seed data includes team rosters for:

- `Pixel Pilots`
- `Circuit Breakers`
- `Torque Three`
- `Relay Lab`

### Seeded sub-events

Every seeded team event gets default sub-events:

- `Qualifier Round`
- `Final Showcase`

### Seeded applications and scores

The database is pre-seeded with:

- sample participant registrations
- sample team rosters
- sample sub-event entries
- draft / validated / locked / disqualified scores

## 12. Data Returned to the UI

### `getHomeData(registrationNumber)`

Returns:

- `stats`
- `student`
- `events`
- `leaderboard`
- `studentApplications`
- `studentScores`
- `subEvents`

Notes:

- values returned to client components must be plain serializable objects
- team applications include `teamMembers`
- sub-event cards include `teamName` and `teamMembers`

### `getJudgeDashboard(username)`

Returns:

- `judge`
- `stats`
- `assignments`
- `scoringQueue`
- `subEventEntries`

Notes:

- assigned events are filtered by `event_judges`
- scoring items are filtered to approved applications only
- sub-event entries expose `teamName` and `teamMembers`

### `getAdminDashboard()`

Returns:

- `stats`
- `events`
- `applications`
- `validationQueue`

## 13. Business Logic Rules Implemented in Code

### Role-based access

- participant-specific actions require a participant session
- judge-specific actions require a judge session
- participant sessions and judge sessions share one cookie name but carry different signed role payloads

### Participant login

- participants log in using registration number + password
- password verification is done using `scryptSync`

### Judge login

- judges log in using username + access code
- judge access is limited to approved judges only
- access code verification is done using `scryptSync`

### Event registration

- duplicate active registration to the same event is blocked
- time overlap with another active event registration is blocked
- if an event is full, new applications are marked `waitlisted`
- team events accept an optional `teamName`
- team events accept participant roster names
- team rosters cannot exceed the event team size
- individual events ignore team roster input

### Sub-event entry

- only approved team applications can enter sub-events
- each team application can enter a given sub-event only once
- sub-events enforce `max_teams`
- team name and participant roster are visible anywhere the sub-event entry is shown

### Judge scoring

- judges can only score applications for assigned events
- judges score exactly five rubric metrics per draft
- each metric must be between `0` and `10`
- weighted totals are calculated from stored rubric weights
- existing unlocked drafts for the same judge/event/participant/round are updated
- locked drafts are immutable

### Event creation

- event type can be `individual` or `team`
- team events enforce minimum team size `2`
- individual events use team size `1`
- new events automatically receive default rubric metrics
- new team events automatically receive two default sub-events
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
    judge-screen.tsx
  globals.css
  judge/
    page.tsx
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
cd "C:\Users\Ritesh Uprety\Desktop\EMS"
npm install
npm run dev
```

Open:

- `http://localhost:3000/`
- `http://localhost:3000/judge`
- `http://localhost:3000/admin`

## 17. Known Constraints

- `node:sqlite` is experimental in Node 22 and emits warnings during build/runtime
- current session handling is suitable for local/demo usage, not hardened production auth
- admin authentication is still not implemented yet; `/admin` remains open
- judge credentials are currently seeded/local and intended for demo workflow
- sub-events are auto-generated for team events and not yet managed from a dedicated admin editor
- verification commands could not be fully run in this workspace until `npm install` has been executed

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

## 19. Planned Structured Event Publication and Registration Design

This section documents the target workflow requested for the next major iteration of the EMS platform. It is a build-ready system design, not a statement that all of the behavior below is already implemented in code.

### Goal

The current system allows newly created admin events to become participant-visible immediately. The target design changes this behavior so that event visibility, registration, approval, and closure are controlled through an explicit event lifecycle.

### Event lifecycle

Recommended lifecycle states:

- `draft`
- `published`
- `registration_closed`
- `ongoing`
- `completed`
- `archived`

Core visibility rule:

- participants only see events in `published`
- participants can only register when the event is published, registration is not manually closed, and the current time is before the registration deadline

### Admin flow

#### Step 1: Create event

Admin should be able to create an event with:

- event name
- description
- date and time
- location or online link
- event type: `individual` or `team`
- maximum participants or maximum teams
- team size rules
- registration deadline
- rules and guidelines
- optional attachments such as poster or PDF
- approval mode
- optional custom registration questions
- agreement requirement for rules and terms

#### Step 2: Select judges

Admin selects one or more judges from the available approved judges and assigns them to the event.

#### Step 3: Save as draft or publish

Admin can:

- save the event as `draft`
- publish the event

Draft behavior:

- editable by admin
- hidden from participants

Published behavior:

- visible to participants
- eligible for registration until registration is closed

#### Step 4: Manage event after creation

Admin can:

- edit event details
- edit judge assignments
- view registered participants or teams
- approve or reject registrations
- move registrations to waitlist if needed
- close registrations manually
- allow automatic closure after deadline
- move event to `ongoing` or `completed`

### Participant flow

#### Step 1: Browse published events

Participants should see only published events in the event catalog.

Each event summary should show:

- event title
- short description
- event type
- date and time
- location or online label
- registration deadline
- availability or status badge

#### Step 2: View event details

When the participant opens an event, the full detail view should include:

- full description
- rules and guidelines
- attachments
- location or online link
- registration deadline
- event type and team rules
- custom questions that will appear in registration
- current registration status if the participant already registered

#### Step 3: Open registration modal

Clicking `Register` should open a modal form rather than directly submitting from the event list.

#### Step 4: Registration form requirements

Pre-filled participant fields:

- name
- email
- phone number
- institution or organization

Additional participant inputs:

- custom questions defined by admin
- required agreement checkbox for rules and terms

#### Step 5: Registration result

After submission, the participant should see a confirmation message and a clear status:

- `pending`
- `approved`
- `rejected`
- `waitlisted`

### Team event logic

If the event type is `team`, the registration modal should additionally require:

- team name
- number of members within allowed limits
- member selection from searchable dropdown
- existing users only, no free-text member entry
- duplicate prevention across team member selection
- one team leader, either auto-selected or explicitly selected

Validation rules:

- all required fields must be completed
- duplicate registrations must be blocked
- team size rules must be enforced
- duplicate team member selection must be blocked
- only existing users can be assigned as team members
- a user should not be part of multiple teams for the same event

### Registration workflow design

Recommended registration statuses:

- `pending`
- `approved`
- `rejected`
- `waitlisted`
- `withdrawn`
- `checked_in`

Recommended approval behavior:

- if the event uses manual approval, submission creates `pending`
- if the event uses auto-approval, submission creates `approved` until capacity is reached
- if the event is full and waitlist is enabled, submission creates `waitlisted`

### Notifications

Recommended notifications:

- confirmation after registration
- approval update
- rejection update
- waitlist update
- event update from admin
- reminder before event start

Preferred first implementation:

- in-app notifications

Optional future extension:

- email notifications

### Dashboard expectations

Participant dashboard should show:

- registered events
- registration status
- team details where applicable
- notifications
- scores or results after the event

Admin dashboard should show:

- draft events
- published events
- pending approvals
- approved registrations
- rejected registrations
- waitlist counts
- participation analytics

Judge dashboard should show:

- assigned events only
- approved participants or teams
- team rosters for team events
- scoring queue for assigned events

### Optional enhancements

Planned optional features:

- waitlist promotion logic
- QR-based check-in
- live status updates such as ongoing or completed
- certificate generation after event completion

### Recommended data model extensions

Suggested additions to `events`:

- `status`
- `location`
- `online_link`
- `registration_deadline`
- `registrations_closed_manually`
- `approval_mode`
- `capacity_mode`
- `max_capacity`
- `min_team_size`
- `max_team_size`
- `rules_text`
- `requires_agreement`
- `published_at`

Suggested additions to `applications`:

- `team_leader_student_id`
- `agreement_accepted`
- `institution_snapshot`
- `phone_snapshot`
- `review_note`
- `reviewed_at`
- `reviewed_by`
- `checked_in_at`

Recommended new tables:

- `event_attachments`
- `event_custom_questions`
- `application_answers`
- `notifications`

Recommended refinement for team membership:

- move `application_team_members` toward a `student_id`-based model instead of name-only storage so searchable existing-user selection and duplicate prevention are easier to implement correctly

### Recommended backend capabilities

Suggested functions for the next implementation phase:

- `createEventDraft()`
- `updateEventDraft()`
- `publishEvent()`
- `closeRegistration()`
- `reopenRegistration()`
- `getPublishedEventsForParticipant()`
- `getEventDetailsForParticipant()`
- `registerForIndividualEvent()`
- `registerTeamForEvent()`
- `approveRegistration()`
- `rejectRegistration()`
- `moveToWaitlist()`
- `getAdminRegistrationQueue()`
- `createNotification()`
- `getParticipantNotifications()`

### Recommended implementation order

Suggested delivery order:

- add event lifecycle and registration-deadline fields
- hide draft events from participant queries
- add admin save-draft and publish controls
- add edit-event and close-registration controls
- add judge assignment during event creation and editing
- add participant event-detail view and registration modal
- add custom questions and agreement handling
- upgrade team-member storage to existing-user selection
- add approval or rejection queue
- add notifications
- add optional enhancements after the core workflow is stable

### Final system rule

The intended long-term rule for the platform is:

- admin controls event visibility and registration state
- participants only register into published, registration-open events
- judges only work with approved entries for their assigned events
- registration state is explicit and trackable at every stage
