# Velox Map - notes for Claude

Personal, non-commercial learning project: a web map of official speed-camera
data (IT, FR, NO, SE, PL, ES).

## Stack

React + Vite + TypeScript, Node 24, SCSS modules (`src/styles/`), Prettier (tabs),
MapLibre + OpenFreeMap. Deployed on Vercel.

- **Scheduled jobs** (VXM-012): Vercel Functions in `api/` (`api/cron/<job>.ts`, shared pieces in `api/_lib/`),
  run by **Vercel Schedules** (`vercel.json` → `schedules`; Cron Jobs are legacy), data in a **private** Vercel Blob
  store. Secrets (`CRON_SECRET`, `OVERPASS_CH_KEY`) only as Vercel env vars - never in code, docs or `.env` files
  in the repo (`.env*` is ignored).
- **Radix:** not used yet - the Switch is native (VXM-010). May come later for components
  (accessibility, uniformity); decide per component, don't add it on your own.
- **Zustand:** only for state shared across the layout (e.g. header ↔ map), from VXM-013.
  Local state first; passing props down 2-3 levels is fine.
- Icons: SVG components in `src/assets/icons/<Name>/` (may move to an icon service later).
- **Commands:** `npm run dev`, `npm run lint`, `npm run build` (lint must pass before build). The app reads its
  data from `/data/…` - on Vercel a function serving the Blob files, locally the dev server's proxy to the
  deployed site. The data files are written only by the scheduled jobs (no local scripts since VXM-012 T8).

## How we work (spec-driven)

- Every task has a ticket `VXM-NNN` and a spec in the private repo
  `velox-map-design/specs/VXM-NNN-name/` (spec.md, plan.md, tasks.md).
- Read the spec first. Write `plan.md` + `tasks.md` and **wait for approval
  before writing any code**.
- One task at a time. Don't add anything that isn't in the spec.
- If the spec is unclear, ask - don't guess.
- Simple over clever: smallest solution that works, no abstractions "for later".
- TypeScript types and interfaces live in `src/types/` (one file per area; every component's props in
  `props.ts`), exported from there - never inside components, lib files or jobs, even when only one file
  uses them; including literal unions
  (`type ClusterLayer = 'clusters' | 'singles'`, not `string[]`). What can't move there (values, type
  guards) stays with its code.
- Export only what another file uses. Exported functions use `export function`; helpers used only inside
  their file are arrow consts (`const name = () => {}`), so the form shows at a glance whether a function
  is used elsewhere. A plain `function` only when an arrow can't do it: called at the top of the file
  before it's defined, overloads, generators, or `this`.
- Forward thinking: build pieces the next countries reuse. Per-country values go in `COUNTRY_*` entries
  keyed by country code (`COUNTRY_MAP`, `COUNTRY_OSM`, `COUNTRY_CARD`); no file named after a country.
  Country decisions: `velox-map-design/docs/countries.md`.
- Keep main components (`App`) clean: no hooks there; state lives in the narrowest component that needs it.
- Code a job in `api/` loads from `src/` imports its **values** with relative `.js` paths (`'../geo.js'`): Vercel
  doesn't resolve `@/` in functions. Type-only imports may keep `@/`. Files in `api/` import each other with `.js` too.

## Design

- UI follows `DESIGN.md`. Never invent colours, sizes, fonts or components that
  aren't in it; if something is missing, ask.
- Mobile first, one breakpoint in use: 768px (`md` in `_breakpoints.scss`; `sm` / `lg` exist, unused).
- Units: px everywhere. Text: hyphens `-`, never en / em dashes; `x`, never the times sign.
- Dashed lines mean "not official" (OpenStreetMap data); official data is always solid.

## Git

- Branches from `develop`: `feat/vxm-NNN-name`, `fix/vxm-NNN-name`.
  `hotfix/*` from `main`, merged into `main` and `develop`.
- Conventional Commits: `type(scope): description`
  (feat, fix, chore, docs, refactor, test, build, style).
  Scope = area of the code (`styles`, `map`, `landing`, `about`, `i18n`, `data`, `cron`,
  country codes…), never the ticket. No scope for changes across areas (`docs: …`).
- Commit footer: `Refs: VXM-NNN-TN #N` (ticket + task from `tasks.md` + GitHub issue),
  e.g. `git commit -m "feat(styles): …" -m "Refs: VXM-001-T3 #1"`.
  Commits that aren't a task: `Refs: VXM-NNN #N`.
- VXM numbers follow the work order (no gaps); the GitHub issue number goes after `#` in the footer. Issues and PRs share one counter, so issue numbers skip (e.g. VXM-007 is issue #9).
- Never commit to `main`. PRs into `develop` with "Closes #N".

## Never

- No user location, navigation or alerts. The "not for use while driving"
  notice is always visible.
- No cookies, no analytics.
- No API keys in code or docs (use Vercel env vars).
- In France OpenStreetMap only adds to official cameras (direction, section path) - never
  cameras of its own, never replacing an official value (R413-15).

## Project docs (private repo, read when relevant)

Decisions are already written - check before proposing something new:

- `velox-map-design/docs/plan.md` - all decisions: scope, stack, data flow, data shape (types), UI, tests
- `velox-map-design/docs/data-sources.md` - every source: endpoint, fields, gotchas, normaliser examples
- `velox-map-design/docs/implementation-process.md` - current tickets, backlog, long-term order, definition of done
- `velox-map-design/docs/countries.md` - per-country choices that differ from the general rules
- `velox-map-design/docs/handoff.md` - current status and how we work
  If a spec contradicts a doc, ask which one is right.
