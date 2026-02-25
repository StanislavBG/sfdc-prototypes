# CLAUDE.md — Project Rules & Development Workflow

## Development Workflow

### Roles & Responsibilities
- **Claude Code**: All development work — code changes, new features, bug fixes, schema changes, file creation/editing
- **Replit**: DevOps only — **Git Sync** and **Deploy**. Replit Agent must NOT modify code, run migrations, or generate drizzle-kit output
- **Replit Agent must NOT touch `replit.md`** — this file is owned by Claude to prevent environment-destructive operations (like auto-generated DROP TABLE migrations)

### Git Flow
1. Claude develops on feature branches (`claude/*`)
2. Claude commits and pushes to origin
3. In Replit: **Git Sync** to pull changes, then **Deploy**
4. Replit should NEVER run `npm run db:push`, `drizzle-kit push`, `drizzle-kit generate`, or any migration commands

## Database Rules — CRITICAL

### NEVER drop tables
- **NEVER** generate or run `DROP TABLE` statements
- **NEVER** run `drizzle-kit push` or `drizzle-kit generate` — these can auto-generate destructive migrations
- **NEVER** delete columns from existing tables without explicit user approval
- The `documents` table (vector store) is managed via **raw SQL** in `server/storage.ts`, NOT via Drizzle schema. Drizzle does not know about it. Running `drizzle-kit push` will try to DROP it.

### Safe schema changes
- New tables: Use `CREATE TABLE IF NOT EXISTS` in `server/routes.ts` (runtime auto-creation) — this is the safe pattern used in this project
- Schema additions to `shared/schema.ts` are for TypeScript types and Zod validation only — they map to tables that are created via raw SQL at server startup
- When adding a new table, ALWAYS use `CREATE TABLE IF NOT EXISTS` in the server routes initialization, never rely on drizzle-kit migrations

### Tables managed via raw SQL (DO NOT put in drizzle-kit migrations)
- `documents` — pgvector document store (created in `server/storage.ts`)
- `identity_rulesets` — Identity Resolution rulesets (created in `server/routes.ts`)

### Tables managed via Drizzle schema (`shared/schema.ts`)
- `greetings`
- `help_documents`

## Code Style & Patterns

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS with Salesforce Lightning Design System (SLDS) custom properties (`--sf-*`)
- shadcn/ui components in `client/src/components/ui/`
- Custom Salesforce components in `client/src/components/salesforce/`
- Navigation is state-driven via `Layout.tsx` (no client-side router)
- Mock data in `client/src/lib/mock-data.ts`
- TanStack React Query for server state

### Backend
- Express 5 + TypeScript
- Routes in `server/routes.ts`, API contract in `shared/routes.ts`
- PostgreSQL via `pg` (node-postgres) pool
- Raw SQL for pgvector and custom tables
- Drizzle ORM for Drizzle-managed tables only

### Modals
- Use hand-rolled conditional rendering pattern (not shadcn Dialog): `fixed inset-0 z-50` overlay with centered card
- Use `bg-black/40` backdrop with `onClick` to close

### Don't
- Don't add unnecessary abstractions for one-off operations
- Don't add comments/docs to unchanged code
- Don't over-engineer — keep solutions minimal
- Don't run `npm run db:push` or any drizzle-kit commands
