# Replit Agent Guide

## Overview

This is a Salesforce Lightning-inspired UI prototype built as a full-stack TypeScript application. The frontend renders a Salesforce Data Cloud-style interface with a header, navigation tabs, an AI agent panel, global search, app launcher, and a home dashboard — all using mock data. The backend is a simple Express server with a single `/api/greeting` endpoint backed by a PostgreSQL database via Drizzle ORM. The project is primarily a frontend-heavy UI prototype with minimal backend logic.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Styling**: Tailwind CSS with CSS custom properties for a Salesforce Lightning Design System (SLDS) color theme. Custom CSS variables defined in `client/src/index.css` (prefixed with `--sf-*`)
- **UI Components**: shadcn/ui component library (new-york style) located in `client/src/components/ui/`. These are copy-pasted Radix UI primitives styled with Tailwind
- **State Management**: TanStack React Query for server state. Local component state via React hooks
- **Animations**: Framer Motion for entrance animations
- **Routing**: Currently no client-side router — the app renders a single `Layout` component. A `not-found.tsx` page exists but isn't wired to a router
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`
- **Key Custom Components**: Located in `client/src/components/salesforce/` — Layout, Header, AgentPanel, AppLauncher, GlobalSearch, HomeContent. These form the Salesforce-style shell
- **Mock Data**: `client/src/lib/mock-data.ts` provides fake Data360 records, search results, app definitions, and navigation config

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via `tsx` in development
- **API Structure**: Routes registered in `server/routes.ts`. API contract defined in `shared/routes.ts` using Zod schemas. Currently only one endpoint: `GET /api/greeting`
- **Storage Layer**: `server/storage.ts` implements an `IStorage` interface with a `DatabaseStorage` class. This abstraction makes it easy to swap storage implementations
- **Static Serving**: In production, `server/static.ts` serves the built Vite output from `dist/public`. In development, `server/vite.ts` sets up Vite's dev server as middleware with HMR

### Data Storage
- **Database**: PostgreSQL, connected via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver
- **Schema**: Defined in `shared/schema.ts`. Currently has one table: `greetings` (id serial, message text)
- **Schema Push**: Use `npm run db:push` (runs `drizzle-kit push`) to sync schema to the database
- **Migrations**: Output to `./migrations/` directory via drizzle-kit

### Build System
- **Development**: `npm run dev` runs `tsx server/index.ts` which starts Express with Vite middleware for HMR
- **Production Build**: `npm run build` runs `script/build.ts` which: (1) builds the client with Vite to `dist/public`, (2) bundles the server with esbuild to `dist/index.cjs`. Certain dependencies are bundled (allowlisted) to reduce cold-start syscalls
- **Production Start**: `npm start` runs `node dist/index.cjs`

### Shared Code
- `shared/schema.ts` — Database schema and Zod insert schemas, shared between server and client
- `shared/routes.ts` — API route definitions with Zod response schemas, providing a typed API contract

## External Dependencies

### Database
- **PostgreSQL** — Required. Connection string via `DATABASE_URL` environment variable. Uses `pg` (node-postgres) Pool
- **connect-pg-simple** — Session store (dependency present but not actively used in current routes)

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** + **drizzle-zod** — ORM, migration tooling, and Zod schema generation
- **express v5** — HTTP server framework
- **@tanstack/react-query** — Client-side data fetching and caching
- **shadcn/ui ecosystem** — Radix UI primitives, class-variance-authority, clsx, tailwind-merge, lucide-react icons, cmdk, embla-carousel, vaul (drawer), react-day-picker, react-resizable-panels, recharts, input-otp, react-hook-form
- **framer-motion** — Animation library
- **zod** — Schema validation used across shared types and API contracts

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal` — Shows runtime errors as an overlay in development
- `@replit/vite-plugin-cartographer` and `@replit/vite-plugin-dev-banner` — Dev-only Replit integrations, conditionally loaded when `REPL_ID` is set

### Fonts
- Google Fonts: Inter, Outfit, DM Sans, Fira Code, Geist Mono, Architects Daughter (loaded via HTML link tags and CSS imports)