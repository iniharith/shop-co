## Objective
- Persist the full-view task modal's last position/size across close/reopen (done), and make the Create New Task category picker list wheel-scrollable with FRAME/ACRYLIC directly under UNASSIGNED (done, pending user verify).
- Fix the `/admin/reports` production crash (`Minified React error #31` — "object with keys {}" rendered as React child).
- Make the Monthly Orders report show **all** tasks (including manual tasks) instead of only website/shop orders — DONE, pushed as `39bcf988`, verified live.
- Fix the monthly-orders 500 ("Internal server error") — DONE, pushed as `9a888253`, verified live (endpoint returns 200 with real rows).

## Important Details
- Repository: `https://github.com/iniharith/shop-co.git`, branch `main`; in sync with `origin/main`.
- Untracked local `docs/` and `scripts/` must never be included in commits.
- `npx tsc --noEmit` passes in `backend/admin` and `backend`; `npm test` (backend) 24/24 pass.
- Deployed admin (`admin.kampungcetak.com`) talks to backend at `https://shop-co-production.up.railway.app` (Railway). Its own dockerfile does `npm ci` + `npm run build` (tsc) + `npm start`, so `dist/` is rebuilt at deploy time (but `dist/` is also tracked — commit rebuilt dist alongside src).
- The local Atlas cluster `shop-co` DB: `orders` collection is EMPTY (0 docs); `tasks` 2555, `fileuploads` 19154, `users` 15. Task `orderId` values are platform order numbers (e.g. `585541340061730111`), NOT Mongo ObjectIds.
- Live-reads of the prod DB use the direct connection string (SRV/querySrv is blocked locally): `mongodb://Admin_Harith:nutella210620@ac-ygpaslc-shard-00-00.dcoixot.mongodb.net:27017/?ssl=true&directConnection=true&authSource=admin` (read-only scripts only).

## Reports Crash — Root Cause & Fix
- Root cause: React error #31 — some API field was an empty object `{}` rendered as a JSX child (axios response → setState → render). Exact field never 100% confirmed, but the page now coerces every dynamic value.
- Pushed fix commits (all in `main`):
  - `67746580` — harden monthly payloads (`monthlyRows` + `toNum`).
  - `addb2116` — route reports API calls through shared axios 401-refresh client.
  - `0a30b67e` — `toStr` coercion for object-valued fields (backend `MonthlyReportRepository.assemble` + frontend).
  - `e6733adc` — guard every remaining dynamic render in the page (users Select items, summary cards, chart data, staff-name lookup, `MetricCard` self-guards via module-level `toStr`/`toNum`).

## Monthly Orders Report — Now Task-Based
- Pushed `39bcf988` "Reports: build monthly orders from all tasks, including manual ones".
- `backend/src/infrastructure/repositories/MonthlyReportRepository.ts` rewritten:
  - `getTaskPage()` paginates the **tasks** collection (createdAt window, excludes `isDeleted: true`) instead of `orders`.
  - `assemble()` builds one row per task; enriches from linked Order/Product/User when ids are valid ObjectIds; falls back to task fields.
  - Manual tasks (no orderId) get `orderId = "TASK-<taskId>"`; customer from `order.customerName || customerUsername || KC-handle parsed from title` (numeric usernames ignored in favor of KC handle).
  - `fileCount` = max(embedded `task.files`, FileUpload docs by taskId); bytes from FileUpload sizes.
- Route `monthlyReports.route.ts` updated: `getTaskPage`/`page.tasks`, `paginationUnit: 'tasks'`.
- Live-verified against production data (Aug 2026): 490 rows, 482 distinct orderIds, 34 manual (`TASK-`), customers/categories/assignees resolving correctly.
- CSV export iterates task pages too.
- `9a888253` fixes the 500: route summary `reduce` overwrote the `Set` accumulator with a count (`acc.orders = new Set([...acc.orders, ...]).size`) — latent while rows were empty, crashed on first non-empty page ("acc.orders is not iterable"). Now uses a separate `seenOrderIds` Set. Confirmed live (Railway auto-deploy, endpoint 200).

## CSV Export Timeout — Diagnosis & Fix (DONE)
- Symptom: browser got `timeout of 15000ms exceeded` (shared admin axios instance caps at 15s, line 18 of `backend/admin/src/utils/axios.ts`).
- Evidence (deployed, 2026-08): page endpoint `GET /api/admin/reports/monthly-orders?month=2026-08&limit=100` = **13.3s**; `GET .../export` = **73.7s** (200 OK, 3030 lines, 267KB). Same logic locally (direct-connection URI, 500-task page) = **~0.8s** → per-query network latency from Railway, not the CSV/report logic.
- Root cause: Railway's `MONGO_URI` was the **SRV** string (as in gitignored `backend/.env`). Every query rode the slow SRV/shared-proxy path. Local tests bypassed it with `directConnection=true` → fast.
- Fix applied:
  - FRONTEND (uncommitted, in `backend/admin/src/app/admin/reports/page.tsx`): export call overrides `timeout: 300000` per-request (only for `/monthly-orders/export`), plus `isExporting` state → button shows "Exporting..." and is disabled (no double-click). `npx tsc --noEmit` passes.
  - RAILWAY (done by user): changed service `shop-co` env `MONGO_URI` to the direct-connection string `mongodb://Admin_Harith:nutella210620@ac-ygpaslc-shard-00-00.dcoixot.mongodb.net:27017/?ssl=true&directConnection=true&authSource=admin`; Railway auto-redeployed (`f52232e8`, SUCCESS 2026-08-14T07:59:14Z).
- Verified live: PAGE **0.59s**, EXPORT **0.65s** (266KB CSV).
- `backend/.env` is gitignored, so the Railway change was dashboard-only (no repo impact).

## Next Move
1. Commit the frontend export-timeout fix (`backend/admin/src/app/admin/reports/page.tsx` only; keep unrelated dirty files like `fileUploadRoutes.ts`/`useAdminDashboard.ts` out unless user asks).

## Relevant Files
- `backend/src/infrastructure/repositories/MonthlyReportRepository.ts` — task-based report (getTaskPage + assemble).
- `backend/src/presentation/routes/monthlyReports.route.ts` — `/api/admin/reports/monthly-orders` (+ `/export`).
- `backend/admin/src/app/admin/reports/page.tsx` — hardened page (module-level `toStr`/`toNum`, all renders guarded).
- `backend/admin/src/utils/axios.ts` — shared 401-refresh client used by the reports page.
- `backend/src/presentation/middlewares/auth.middileware.ts` — returns "user token is expired" on invalid Bearer JWT.
- `backend/src/domain/entities/Task.ts` — Task schema (orderId, customerUsername, category, files, status, assignee).
- `backend/src/domain/entities/FileUpload.ts` — file sizes per taskId.
- `backend/admin/src/components/global/tasks/tasksManager.tsx` — CreateTaskDialog inline dropdown fix (uncommitted? committed: category picker was `934b8994`).
- `backend/admin/src/components/global/tasks/TaskModal.tsx` — view persistence (committed `1158a7c5`).
- `%TEMP%\opencode\` — repro/analysis scripts (some cleaned up).
