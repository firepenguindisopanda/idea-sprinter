# specs before code - frontend

The frontend of **specs before code**, a system-design learning platform. It
writes a **design spec** from an idea and teaches with exercises graded
against answer keys. The backend is `multi-agent-system` (FastAPI on NVIDIA
NIM); this Next.js app calls it.

Created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack):
TypeScript, Next.js, TailwindCSS, shadcn/ui, Turborepo, PWA support.

## Pages

- **Workshop** (`/workspace`): clarify an idea, pick a direction, write the
  spec. The run is followed live: the plan (the ledger), then the one writer,
  then its status - `checked`, or what is left unresolved. Saved to the
  dashboard. `/generate`, `/ideation` and `/generator` redirect here.
- **Practise** (`/learn`, `/learn/[exercise]`): draft a design for an
  exercise, take hints, reveal the reference and the answer-key checks your
  draft passed (grades are provisional), then compare with a generated design.
  Missed checks link reading from the corpus.
- **PRD** (`/prd`): a persona-based chat that builds a PRD; "Design this"
  opens the Workshop on a design written from it.
- **Architecture** (`/architecture`): the Studio - architecture options with
  diagrams; contest, refine or challenge an option.
- **Dashboard** (`/dashboard`, `/dashboard/[id]`): saved projects, including
  documents from before the revamp. PDF export here and from the Workshop.
- **Profile** (`/profile`) and Google sign-in (`/auth/login`).

## Running it

```bash
npm install
npm run dev        # all apps through Turborepo; the web app is on http://localhost:3000
npm run dev:web    # the web app only
```

The app reads `NEXT_PUBLIC_API_URL` (default `http://localhost:5001`) to find
the backend. It is read at build time, so set it before `next build`. For
local development put it in `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001
```

## Tests and checks

From `apps/web`:

```bash
npx vitest run --testTimeout=30000   # unit tests (a 20 s cold start under parallel load needs the timeout)
npm run test:e2e                     # Playwright
npm run lint                         # type-scale and contrast checks, then ESLint
npx tsc --noEmit                     # types (apps/web defines no check-types script)
```

## Structure

```
idea-sprinter/
├── apps/
│   └── web/   # the Next.js app
```
