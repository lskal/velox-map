# Velox Map - notes for Claude

Personal, non-commercial learning project: a web map of official speed-camera
data (IT, FR, NO, SE, PL, ES). Max is learning: explain the why, keep steps small.

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

## Design

- UI follows `DESIGN.md`. Never invent colours, sizes, fonts or components that
  aren't in it; if something is missing, ask.
- Mobile first, one breakpoint (768px, from `_breakpoints.scss`).

## Git

- Branches from `develop`: `feat/vxm-NNN-name`, `fix/vxm-NNN-name`.
  `hotfix/*` from `main`, merged into `main` and `develop`.
- Conventional Commits: `type(scope): description`
  (feat, fix, chore, docs, refactor, test, build, style).
- Never commit to `main`. PRs into `develop` with "Closes #N".

## Never

- No user location, navigation or alerts. The "not for use while driving"
  notice is always visible.
- No cookies, no analytics.
- No API keys in code or docs (use Vercel env vars).
