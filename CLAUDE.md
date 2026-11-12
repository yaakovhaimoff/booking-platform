# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Response Format

Start every reply with "Yaakov". End every reply with a horizontal rule (`---`) as the bottom line.

## Accuracy & Verification

Always verify claims against actual source code and live state – never source facts from README
files, invented example output, or assumed defaults. If a script hasn't been run, say so explicitly.

## Project Overview

**torni** – a multi-tenant SaaS booking platform for service businesses (barbershops, salons).
Spring Boot backend (`/backend`, package `com.ServiceBookingPlatform`) with schema-per-tenant
PostgreSQL, and a React + Vite SPA (`/frontend`).

## Commands

```bash
# Backend (/backend). First copy backend/.env.example to backend/.env and fill DB_USER / DB_PASSWORD
# (the app refuses to start without them).
./mvnw spring-boot:run
./mvnw test
./mvnw package -DskipTests

# Frontend (/frontend)
npm install
npm run dev      # http://localhost:5173
npm run lint
npm test        # Vitest
npm run build
```

## Architecture Rules

### Layering
`controller -> service -> repository`. Controllers only handle HTTP (parse, validate, map to a
response DTO) and call services. Controllers never hold repositories and never contain business logic.

### Service–Repository Ownership
Each repository belongs to exactly one service. Only that service may inject and call the repository
directly. If another service needs data from that repository, it must call a method on the owning
service – never reach across and inject the repository itself. Controllers never hold repositories.

### DTOs at the boundary
Controllers return response DTOs, not JPA entities. Entities stay inside the service layer.

## Testing

Every new feature, endpoint, service method, or bug fix ships with tests in the same change. A bug fix
starts with a test that fails for the bug. Backend: unit tests for service logic and MockMvc tests for
access rules (401 logged out, 403 wrong owner, success path); run `./mvnw test` before reporting done.
`TenantIsolationIntegrationTest` runs the whole app against a throw-away database on a local Postgres
(DB_HOST, DB_PORT, DB_USER, DB_PASSWORD; it skips when none is reachable). Any change touching tenant
routing, ownership checks or tenant data must keep it green and extend it.
Frontend: Vitest with Testing Library (`*.test.js` / `*.test.jsx` next to the code, helpers in
`frontend/src/test/`); run `npm test` and `npm run lint` before reporting done. If a change cannot be tested, say so explicitly
instead of skipping silently. Do not mark work done on a green build alone: state which tests cover it.

## Code Style

- Use full words for all identifiers – no abbreviations. `credentials` not `creds`, `repository` not
  `repo`, `manager` not `mgr`. This applies to type parameters, variables, fields, and method names.
- No section divider comments. Do not add decorative separators like `// ── Section name ────`.
- Never use em-dashes (`—`) in frontend UI text that a user sees (any string rendered in
  `frontend/src`). For a dash separator use an en-dash (`–`), not a hyphen. Reserve the plain
  hyphen (`-`) for compound words. This applies to labels, hints, placeholders, option text, and
  copy – not to code identifiers or backend files.

## Workflow & Style

Wait for the full request and confirm understanding before implementing; don't jump to a
design/auth choice or add features the user hasn't finished asking for. Match existing conventions
instead of inventing new UI patterns.

## Git Safety

Never run `git checkout`/`reset` during recovery without first stashing or confirming with the
user – uncommitted work has been silently reverted before.

The GitHub remote for this repo is `origin`. After every commit the user asks for, push to `origin`
immediately (commit and push are one step here).
