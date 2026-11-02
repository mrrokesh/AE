# anita_enterprise_Demo

# Anita Enterprises CRM

Frontend-only CRM / lead-management app for Anita Enterprises, Salem. Built with Vite, React, TypeScript, Tailwind v4, react-router, zustand. All data is mocked in `localStorage` behind an async API layer so a real backend can replace it later.

## Run
```bash
npm install
cp .env.example .env   # optional
npm run dev            # http://localhost:5173
```
Other scripts: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format`.

## Demo data
On first load ~40 sample leads, 27 products, 6 customers and 4 users are seeded into `localStorage` (the data is fictional). Reset anytime in **Settings → Reset demo data**.

## AI (stub)
`src/services/ai/aiClient.ts` exposes `ask({ task, input })` and currently returns mocked responses. **Do not add API keys to the frontend.** Real calls must go through a backend proxy endpoint configured via `VITE_AI_PROXY_URL`; the proxy holds provider keys and handles auth and rate limiting.

## Status
Set up: routing, layout, theme, UI primitives, toasts, modal/drawer, mock API, seed data, AI stub.
Placeholders: every page except Settings. See `CLAUDE.md` for architecture and conventions.
