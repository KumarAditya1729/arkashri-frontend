# Arkashri Frontend

Arkashri Frontend is the production Next.js application for the Arkashri audit platform. It provides the auditor-facing workspace for Indian CA/audit workflows: engagement dashboards, planning, risks, controls, evidence, review, reporting, ERP/Tally entry points, regulatory updates, client portal screens, and the full production audit flow.

## Repository Role

Production frontend source of truth: `KumarAditya1729/arkashri-frontend`.

The backend/platform repo `KumarAditya1729/Arkashri` keeps the FastAPI backend, infrastructure, and a pointer/reference to this frontend. Some root-level frontend artifacts still exist in the backend repo for compatibility/history, but this repo is the frontend codebase that should be deployed to Vercel.

Recommended long-term cleanup:

- Keep `Arkashri` as backend/infrastructure.
- Keep `arkashri-frontend` as the production frontend.
- Remove duplicate root frontend files from `Arkashri` only after deployment ownership is fully confirmed.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn-style UI primitives
- HttpOnly cookie auth through Next.js route handlers
- Backend proxy route at `/api/proxy/*`

## Environment Variables

Copy `.env.example` to `.env.local` for local development:

```bash
cp .env.example .env.local
```

Required/important variables:

```bash
API_URL=http://localhost:8001
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_TENANT=default_tenant
NEXT_PUBLIC_WS_URL=ws://localhost:8001/ws
```

Notes:

- `API_URL` is server-side and used by Next.js auth/proxy routes.
- `NEXT_PUBLIC_API_BASE_URL` is the public backend URL used by browser-side API calls.
- `NEXT_PUBLIC_APP_URL` is used for server-side self-calls to the frontend proxy.
- In production, configure these in Vercel project settings. Do not commit real secrets.

## Local Development

Install dependencies:

```bash
npm ci
```

Run the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Expected backend during local development:

```text
http://localhost:8001
```

## Quality Gates

Run before every PR:

```bash
npm run lint
npm run typecheck
npm run build
```

`npm run type-check` is also available as the direct TypeScript command. `npm run typecheck` is the CI-friendly alias.

Production builds do not ignore TypeScript or ESLint errors. If a build fails, fix the underlying issue rather than suppressing it in `next.config.mjs`.

## Deployment

Primary target: Vercel.

Vercel settings:

- Framework: Next.js
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `.next`

Configure Vercel environment variables:

```bash
API_URL=https://<backend-host>
NEXT_PUBLIC_API_BASE_URL=https://<backend-host>
NEXT_PUBLIC_APP_URL=https://<frontend-host>
NEXT_PUBLIC_API_TENANT=<tenant-id>
NEXT_PUBLIC_WS_URL=wss://<backend-host>/ws
```

## GitHub Actions

Frontend CI is defined in `.github/workflows/ci.yml` and runs:

```bash
npm ci
npm run lint
npm run typecheck
npm run build
```

## Staging Smoke Test

After deployment, verify:

- Login succeeds and stores session via HttpOnly cookie.
- Dashboard loads without proxy errors.
- Engagement creation works.
- Engagement detail page loads live backend data or a clear unavailable state.
- Evidence upload UI renders and can call backend evidence endpoints.
- Report page renders.
- API proxy reaches the configured backend.
- Logout/session expiry works.
- Mobile layout is usable on dashboard, engagement, evidence, and report pages.

## CA Audit Production Flow

The UI is designed around this market-ready journey:

1. Create engagement
2. Add client
3. Import Tally/Excel
4. Map ledgers
5. Run GST/MCA checks where backend support is configured
6. Complete SA/CARO checklist
7. Upload/link evidence
8. Prepare workpapers
9. Partner review
10. Generate statutory report
11. Add UDIN where configured
12. Seal and share

Features that depend on live backend integrations should show clear unavailable states rather than pretending data exists.
