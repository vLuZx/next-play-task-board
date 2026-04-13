# NextPlay Client

Frontend application for the NextPlay task board. This client is built with React, TypeScript, Vite, and React Router, and uses Supabase for data and authentication.

## Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- Supabase
- pnpm

## Prerequisites

Before running the app, make sure you have:

- Node.js 20+
- pnpm installed
- A Supabase project with the required tables, auth setup, and storage buckets

## Environment Variables

The client requires these Vite environment variables:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-or-publishable-key
```

The values are read in [src/lib/supabase/client.ts](src/lib/supabase/client.ts).

## Running the Application

From the repository root:

```bash
pnpm -C client install
pnpm -C client dev
```

Then open the local Vite URL shown in the terminal, typically `http://localhost:5173`.

If you prefer working from inside the client folder:

```bash
cd client
pnpm install
pnpm dev
```

## Available Scripts

Run these from the `client` folder, or prefix them with `pnpm -C client` from the repo root.

```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
```

What they do:

- `pnpm dev`: starts the Vite development server
- `pnpm build`: runs the TypeScript build and creates a production bundle
- `pnpm preview`: serves the production build locally
- `pnpm lint`: runs ESLint across the client codebase

## Basic Project Structure

```text
client/
  public/                     Static assets served as-is
  src/
    components/               Reusable UI building blocks
    features/                 Feature-specific hooks and API logic
      auth/                   Authentication flows
      tasks/                  Task fetching, mutations, and board state
      teams/                  Team member fetching and mutations
    lib/                      Shared utilities and integrations
      supabase/               Supabase client and auth helpers
      utils/                  Generic helper utilities
    pages/                    Route-level page components
    types/                    Shared TypeScript types
    App.tsx                   App shell, router, theme state, board view state
    main.tsx                  React entry point
    index.css                 Global styles
  package.json                Scripts and dependencies
  vite.config.ts              Vite configuration
```

## Runtime Flow

At a high level:

- [src/main.tsx](src/main.tsx) mounts the app
- [src/App.tsx](src/App.tsx) sets up routing, theme mode, and board view mode
- [src/components/sidebar/Sidebar.tsx](src/components/sidebar/Sidebar.tsx) renders global navigation and display controls
- [src/pages/BoardPage.tsx](src/pages/BoardPage.tsx) renders the task board page, filters, modals, and task detail panel
- [src/pages/TeamMembersPage.tsx](src/pages/TeamMembersPage.tsx) renders team member management
- [src/features/tasks/hooks/useTaskBoard.ts](src/features/tasks/hooks/useTaskBoard.ts) drives most board state and task mutations
- [src/features/teams/hooks/useTeamMembers.ts](src/features/teams/hooks/useTeamMembers.ts) drives team member state and mutations

## Notes

- The default board view is currently `column`, with row view available on large viewports.
- The app throws at startup if Supabase environment variables are missing.
- Component-level documentation lives in [src/components/README.md](src/components/README.md).
