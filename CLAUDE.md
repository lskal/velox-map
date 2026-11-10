# Velox Map - notes for Claude

Personal, non-commercial learning project: a web map of official speed-camera
data (IT, FR, NO, SE, PL, ES).

## Stack

React + Vite + TypeScript, Node 24, SCSS modules (`src/styles/`), Prettier (tabs),
MapLibre + OpenFreeMap, Zustand, Radix. Deployed on Vercel.
Commands: `npm run dev`, `npm run lint`, `npm run build` (lint must pass before build).

## How we work (spec-driven)

- Every task has a ticket `VXM-NNN` and a spec in the private repo
  `velox-map-design/specs/VXM-NNN-name/` (spec.md, plan.md, tasks.md).
- Read the spec first. Write `plan.md` + `tasks.md` and **wait for approval
  before writing any code**.
- One task at a time. Don't add anything that isn't in the spec.
- If the spec is unclear, ask - don't guess.
- Simple over clever: smallest solution that works, no abstractions "for later".
- Exported TypeScript types and interfaces live in `src/types/` (one file per area), never inside components.

## Design

- UI follows `DESIGN.md`. Never invent colours, sizes, fonts or components that
  aren't in it; if something is missing, ask.
- Mobile first, one breakpoint (768px, from `_breakpoints.scss`).

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

## Project docs (private repo, read when relevant)

Decisions are already written - check before proposing something new:

- `velox-map-design/docs/plan.md` - all decisions: scope, stack, data flow, data shape (types), UI, tests
- `velox-map-design/docs/data-sources.md` - every source: endpoint, fields, gotchas, normaliser examples
- `velox-map-design/docs/ui-implementation-process.md` - UI steps and checklist per step
- `velox-map-design/docs/handoff.md` - current status and how we work
  If a spec contradicts a doc, ask which one is right.
