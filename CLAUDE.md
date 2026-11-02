# Anita Enterprises CRM

Frontend-only CRM / lead manager for Anita Enterprises (Salem, Tamil Nadu), which sells TVS printers (thermal, label, dot-matrix, laser, ink-tank) and speakers (JBL, Zebronics). There is no backend yet.

## Stack
Vite + React 19 + **TypeScript** (strict) · Tailwind CSS v4 (`@tailwindcss/vite`, tokens in `@theme` in `src/index.css`) · react-router-dom v7 · zustand · lucide-react · date-fns · recharts (dashboard charts) · @tanstack/react-table **v8** (leads table) · i18next/react-i18next.

## Commands
`npm run dev` · `npm run build` (i18n check + tsc + vite) · `npm run i18n:check` · `npm run typecheck` · `npm run lint` · `npm run format`

## Folder rules
- `src/app/` router, layout shell, providers, nav config.
- `src/pages/<Page>/index.tsx` one folder per route, default export. **Pages only compose**: hooks + components. No business logic, no direct API/localStorage calls.
- `src/components/ui/` generic primitives with no domain knowledge. `src/components/` shared app components (Sidebar, Topbar, StageBadge…).
- `src/features/<domain>/` domain logic: hooks, selectors, validation, mappers. Features call `services/api`.
- `src/services/api/` mock API. `src/services/ai/` AI stub. `src/store/` zustand: UI state (theme, language, sidebar, toasts, overlays, settings, session, clock) plus `crmStore`, a client cache of API data loaded by `DataGate`. Mutations go through `features/*/actions.ts` (which call `services/api` then update the cache).
- `src/data/seed/` seed built in TS (`buildSeed(now)`, dates relative to now; bump `SEED_VERSION` in `storage.ts` when the shape changes). `src/locales/{en,ta}/*.json` translations. `src/lib/` pure utils. `src/constants/` stages, sources, priorities, categories. `src/types/` domain types.
- Import with the `@/` alias (= `src/`). No deep relative `../../` imports.

## Mock-API contract (`src/services/api`)
- UI never touches `localStorage`; only `services/api` does (`storage.ts`).
- Every resource exposes the same REST-shaped async methods, with 200-500ms simulated latency:
  `list(params) -> Paginated<T>`, `get(id) -> T`, `create(input) -> T`, `update(id, patch) -> T`, `remove(id) -> void`.
- `ListParams`: `search`, `filters`, `sortBy`, `sortDir`, `page` (1-based), `pageSize`. Missing ids throw `ApiError(404)`.
- Entities have `id`, `createdAt`, `updatedAt` (ISO UTC). The API sets them; callers pass `CreateInput<T>` / `UpdateInput<T>`.
- Swapping in a real backend means re-implementing `leadsApi`, `productsApi`, … over `fetch` (`VITE_API_BASE_URL`) with identical signatures. Do not change callers.
- Seed dates are shifted relative to "now" at seed time. `adminApi.resetDemoData()` reseeds (Settings page).
- Domain-specific operations (e.g. change stage) get added to the resource's API object in `index.ts`, not in UI code.

## AI rule
- **Never put API keys or provider SDKs in the frontend.** All AI calls go through a backend proxy at `VITE_AI_PROXY_URL`. Do not use `VITE_*` for secrets (they are bundled).
- Single entry point: `ask({ task, input })` in `src/services/ai/aiClient.ts`; task names live in `tasks.ts`. Currently returns mocks from `mocks.ts`.

## Conventions
- Functional components only; small files (aim < 150 lines); one component per file; named exports except pages (default, for lazy routes).
- Business logic lives in `features/` or `lib/`, never inline in pages or JSX.
- Indian formatting only via `lib/format.ts` and `lib/dates.ts`: `formatINR` (₹ en-IN grouping), `formatPhone` (+91 xxxxx xxxxx), `formatDate` (DD MMM YYYY, IST). Phones are stored as 10 digits without +91.
- Colours via tokens only (`bg-surface`, `text-fg-muted`, `bg-brand-600`…); no raw hex/Tailwind palette colours. Rebrand by changing `--brand-hue` in `index.css`.
- Mobile-first usable: sales staff use phones. Test at ~390px width.
- Stages/sources/priorities/categories come from `constants/`; don't hard-code strings.
- Run `npm run typecheck && npm run lint` before finishing a change.

## Roles, i18n, never-miss rules (added in the demo build)
- Demo login (`sessionStore`): `owner` sees everything + Team day; `staff` sees own + unassigned leads (`features/auth/permissions.ts`).
- **Every visible string uses `t()`** with keys in BOTH `locales/en` and `locales/ta` (natural spoken Tamil). Domain labels come from `stages.*`, `sources.*`, `lostReasons.*`, `categories.*`. `npm run i18n:check` enforces parity and that literal keys exist; it runs in `npm run build`.
- Never-miss rules live in `features/leads`: `sla.ts` (response SLA, escalation), `followUps.ts` (overdue/today/upcoming), `actions.ts` (`logActivity` throws `NextActionRequiredError` unless next follow-up is set or the lead is won/lost), `temperature.ts`/`services/ai/engines/scoring.ts` (Hot/Warm/Cold).
- AI (`services/ai`): `ask({task,input})` runs rule-based engines in `engines/` (600-1500ms fake latency), output follows UI language via `tr()`. Hooks/UI in `features/ai` (`useAiTask`, `LeadAiPanel`, `AssistantChat`). Real LLM = backend proxy only.
- Dashboards: `features/dashboard` (pure `stats.ts`, recharts cards using CSS-variable tokens). `pages/Dashboard` picks owner vs staff view.
- Lint gotchas (react-hooks v7): no `Date.now()` in render (use `useNow()`), no synchronous setState in effects.
- Still placeholders: Customers, Products, Reports pages.
- Product catalog = real data from anitaenterprises.in. Regenerate with `npm run import:products` (`scripts/import-products.ts`, Node only, NOT in the bundle; Store API first, sitemap+cheerio fallback). It overwrites `src/data/seed/products.json` (ids `p<wooId>`, parsed `specs` with `null` for unknown, demo stock fields). After re-importing, old product ids in `data/seed/leadRows.ts` and `features/enquiries/templates.ts` must still exist, and bump `SEED_VERSION` in `services/api/storage.ts`.
- Stock (`features/products/stock.ts`): owner edits qty/status/restock date on the Products page; qty and status stay consistent (0 = out, 1-3 = low). Restock dates in the seed are fixed at import time.
- **Stock-outs (`features/products`)**: `similarity.ts` (pure, tested with `npm test` via vitest) ranks in-stock alternatives (null specs skipped, confidence shown; reasons are `catalog.sim.*` keys). `waitlist.ts` (join waitlist, `notifyRestock`), `alternatives.ts` (`addAlternative`, `oosInterest`), `demand.ts` (lost-demand stats, used by the owner `StockDemandCard` and the AI briefing). `Lead.waitlist` holds product ids; `updateStock` returns `{product, waiting}` and restocking creates call-now follow-ups plus an `act.backInStock` entry (bell kind `restock`). Marking Lost with reason out_of_stock goes through `openLostReason(onConfirm, leadId)`, which prompts for alternatives/waitlist first. AI tasks: `explainAlternative`, WhatsApp kind `out_of_stock_alternative`. Demo: TVS RP 3230 (`p5634`) is forced out of stock in `scripts/import-products.ts`; `SEED_VERSION` is `v4`.
