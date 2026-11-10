# DeepResearch AI — Frontend

The web application for DeepResearch AI, built with Next.js App Router,
TypeScript, Tailwind CSS, and TanStack Query.

> This repository contains the frontend only. The FastAPI backend, PostgreSQL
> database, Redis instance, and ARQ worker run separately. The browser talks to
> the backend over its HTTP API and authenticated Server-Sent Events (SSE); the
> frontend does not connect directly to PostgreSQL or Redis.

## What is implemented

- Cookie-based registration, login, session refresh, and logout.
- Research creation, paginated history, research details, tasks, and sources.
- Live research events over SSE, including reconnect handling.
- Research cancellation and generated report retrieval/download.
- Saved Reports with search, depth filtering, server-side pagination, and
  save/unsave actions.
- Light and dark themes.

The research workspace and reports use backend data. Any explicitly identified
mock/demo UI should not be treated as a real research result.

## Requirements

- Node.js 20.9 or newer.
- npm.
- A running DeepResearch AI backend for authentication and live data. The
  backend's required PostgreSQL, Redis, and ARQ worker setup must be running for
  research jobs to execute. Follow the backend repository's own setup
  instructions for those services and commands.

## Run locally

From this repository:

```bash
npm install
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_URL` in `.env.local` to the backend **origin** (not an API
path):

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The API client defaults to `http://localhost:8000` if `NEXT_PUBLIC_API_URL` is
unset. Restart the Next.js server after changing `.env.local`.

### Backend and browser configuration

- The API client sends requests with cookies (`withCredentials: true`).
- Configure the backend CORS allow-list to include the exact frontend origin,
  commonly `http://localhost:3000`, and enable credentialed requests. Do not
  use `*` as the allowed origin with credentials.
- Keep the frontend and backend hostnames consistent. For local development,
  use `localhost` for both rather than mixing `localhost` and `127.0.0.1`;
  browsers treat their cookies as different hosts.
- The backend must set its authentication cookies with attributes compatible
  with the frontend origin and the chosen local/production deployment.
- The SSE connection uses native `EventSource` with credentials and requires
  the backend events endpoint and CORS configuration to support it.
- `NEXT_PUBLIC_API_URL` is public browser configuration. Never put secrets,
  database credentials, or private API keys in `NEXT_PUBLIC_*` variables.

## Backend API used by the frontend

All paths below are relative to `NEXT_PUBLIC_API_URL`.

| Area | Endpoints used |
| --- | --- |
| Authentication | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout` |
| Research | `GET` and `POST /api/v1/research`; `GET /api/v1/research/{research_id}`, `/tasks`, `/sources`, `/report`; `POST /api/v1/research/{research_id}/cancel` |
| Live updates | `GET /api/v1/research/{research_id}/events` (SSE) |
| Conversations | `GET` and `POST /api/v1/conversations`; `GET /api/v1/conversations/{conversation_id}`, `/messages`; `POST /api/v1/conversations/{conversation_id}/messages/stream` (SSE) |
| Saved Reports | `GET` and `POST /api/v1/saved-reports`; `GET /api/v1/saved-reports/{research_id}/status`; `DELETE /api/v1/saved-reports/{research_id}` |

Research depth values are `quick`, `standard`, and `comprehensive`. Authentication
uses HttpOnly cookies; the frontend does not store access tokens in browser
storage. Registering an account does not sign it in automatically.

## Development commands

```bash
npm run dev       # Start the local development server
npm run lint      # Run ESLint
npx tsc --noEmit  # Check TypeScript types
npm run build     # Create a production build
npm run start     # Serve the production build
```

The Saved Reports excerpt helper has focused Node tests. Running them directly
requires Node.js 22.6 or newer for built-in TypeScript type stripping:

```bash
node --experimental-strip-types --test src/features/saved-reports/saved-report-excerpt.test.mjs
```

There is no general `npm test` script configured in this repository.

## Project structure

```text
src/
  app/                 App Router routes and global styles
  components/          Shared layout and UI components
  features/
    auth/              Authentication API, hooks, and screens
    research/          Research API, SSE, workspace, and reports
    saved-reports/     Saved Reports API, hooks, page, and controls
  hooks/               Shared client hooks
  lib/api/             Axios client and normalized API errors
  providers/           Theme and TanStack Query providers
  types/               Shared application types
```

Feature API functions use the shared Axios client. TanStack Query hooks own
request state and cache invalidation; UI components should use those hooks
instead of issuing duplicate requests. Research live updates use native
`EventSource`; conversation responses use credentialed `POST` fetch streaming
because the message endpoint accepts a request body.

## Troubleshooting

### API requests fail or the browser reports a CORS error

1. Confirm the backend is running at the origin in `.env.local`.
2. Confirm backend CORS allows the exact frontend origin with credentials.
3. Confirm both URLs use the same local hostname (`localhost` or
   `127.0.0.1`).
4. Restart the frontend after changing `.env.local`.

### You are sent back to sign in

Check that the backend is reachable and its cookie domain, `SameSite`, `Secure`,
and CORS settings match the frontend origin and whether the connection uses
HTTP or HTTPS.

### Research remains queued or live updates do not arrive

The API alone is not sufficient to execute research. Verify the backend's
PostgreSQL and Redis services and ARQ worker are running, then check that the
research events endpoint is reachable and permits credentialed SSE requests.

### A report or saved report is unavailable

Reports become available only after successful research/report generation.
Saved Reports can only include completed research with a generated report.
Check the backend API response and frontend network console rather than
assuming an unavailable report is an empty successful result.
