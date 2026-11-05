# DeepResearch AI frontend

The Next.js App Router frontend for DeepResearch AI. The FastAPI backend remains
separate. Research and report screens use mock data; authentication uses the
backend cookie-based auth API.

## Run locally

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to
`.env.local` and set `NEXT_PUBLIC_API_URL` to the backend origin (for example,
`http://localhost:8000`).

## Authentication

The frontend calls `/api/v1/auth/register`, `/login`, `/me`, `/refresh`, and
`/logout` on the configured API origin. Requests include credentials. The
backend sets HttpOnly access and refresh cookies; the frontend does not persist
tokens in web storage. Registration creates an account but does not sign it in,
so the user signs in after registration.

The dashboard uses authenticated `GET /api/v1/research?page={page}&limit={limit}`
for history and `POST /api/v1/research` with `{ query, depth }` to start research.
Supported depths are `quick`, `standard`, and `comprehensive`.

## Project structure

- `src/app` — routes and global styles
- `src/features` — feature-specific UI and behavior
- `src/features/auth` — auth forms, API functions, hooks, and route protection
- `src/components` — shared layout and shadcn/ui components
- `src/hooks` — reusable client hooks
- `src/providers` — theme and TanStack Query providers
- `src/lib/api` — Axios client and API error normalization
- `src/types` — shared TypeScript types
