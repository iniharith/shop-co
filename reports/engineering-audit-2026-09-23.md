# Shop Co engineering audit and implementation report

Date: 2026-09-23. Scope: repository inspection and local changes only. No production deployment, live database write, secret rotation, or real payment was performed. The changes in this report are uncommitted.

## A. Architecture summary

The customer storefront and staff admin are separate Next.js applications. The Express/TypeScript backend exposes REST routes, uses MongoDB through Mongoose, and uses Redis for selected caches and pub/sub. NextAuth manages browser sessions; the backend checks bearer tokens and staff roles. Catalog, cart, order, task, file upload, report, notification, EasyParcel, and S3 code live in the backend. The customer checkout currently creates Cash on Delivery orders. Railway hosts the backend; the repository has separate frontend/admin deployment configuration. GitHub Actions is the CI entry point.

The checkout path is storefront address form and cart → `/api/orders/shipping/quote` → `/api/orders` → stock decrement and order persistence → cart clear, notification, task creation, and Redis broadcast. EasyParcel supplies live shipping quotes. There is no active online card/wallet capture or payment webhook in this path.

## B. Problems discovered and priority

| Severity | Finding | Why it matters | State |
| --- | --- | --- | --- |
| Critical | Any authenticated customer could request another order by ID; order list/status and status mutation routes lacked staff authorization. | Exposed order data and allowed unauthorized changes. | Fixed in code; integration test with real JWT/DB pending. |
| Critical | Browser-provided shipping price was accepted as order total. | A customer could reduce a COD order total. | Server recalculates and compares the quote; provider integration test pending. |
| High | Checkout retries could create duplicate orders; stock updates and order write were separate operations. | Double submissions could affect inventory and fulfillment. | Checkout key and unique sparse index added; database race test pending. |
| High | Tracked `env_files.zip` and `mail/mailserver.env` need a secret exposure review. | Repository history could contain usable credentials. | No secrets opened, removed, or rotated in this task. |
| High | Authenticated artwork upload allows arbitrary file types and up to 100 files at a 500 MB default per file. | Storage, malware, and abuse risk. | Requires an agreed print-file policy before restriction. |
| High | Order creation triggers task/notification/broadcast inline without durable retries or a visible failure queue. | An order can exist while staff automation is missing. | Post-write failure no longer reports checkout failure; durable recovery remains open. |
| Medium | The footer advertised card/wallet brands and the payment page advertised FPX despite COD-only checkout. | Creates false payment expectations. | Corrected to describe the active checkout. |
| Medium | Footer linked to three routes absent from the storefront build. | Customers landed on 404 pages. | Corrected. |
| Medium | Frontend lint has 174 errors and 121 warnings across the repository. | Reduces confidence in later changes. | Changed checkout/payment/footer files have no lint errors; broad cleanup remains. |
| Medium | Backend production audit still reports two moderate transitive findings. | Dependency exposure remains. | Breaking replacement needs separate validation. |

Other audit notes: the homepage makes turnaround claims and displays named testimonials; marketing should verify these claims. SEO has `robots.txt` and `sitemap.xml`, but product metadata/structured data and page-specific accessibility were not exhaustively validated. The admin has Sentry wiring; order/task recovery is still primarily log-driven. File handling, invoices, refunds, cancellations, coupons, stock concurrency, and every admin screen need dedicated staging exercises before a commercial readiness claim.

## C. UI improvements implemented

The payment page now uses the storefront's semantic surfaces and typography and states the actual payment option. The footer no longer shows unsupported payment logos or dead company links. These are small changes that keep the existing brand rather than changing its identity.

## D. UX improvements implemented

Checkout now shows shipping calculation, courier, an explicit retry on quote failure, an empty-cart state, a total only after a valid quote, and a configuration confirmation before order submission. A failed quote disables the place-order action. The payment page sends customers to support for questions.

## E. Mobile improvements

Checkout summary and address form use a single column on narrow screens. A local browser pass at 390 px found no document-level horizontal overflow on the storefront home route; the payment page rendered its content. Authenticated checkout could not be visually exercised without a disposable staging account.

## F. Accessibility improvements

The quote failure uses an alert role, retry is a real button, and new payment/support actions have visible text and focus styling. Full keyboard, screen-reader, contrast, and automated accessibility audits remain open.

## G. Security vulnerabilities discovered

Order ownership/role gaps, client-controlled shipping totals, permissive upload acceptance, broad payload limits, and potentially sensitive tracked files are the primary findings. No production secret contents were inspected or disclosed.

## H. Security fixes implemented

Order detail requires owner or staff. Order list/status reads and status/archive writes require staff. The migration endpoint now requires a sysadmin and uses POST. Avatar management is staff-only. Credentialed CORS accepts known or configured origins instead of reflecting arbitrary browser origins. The order total uses a server-side provider quote and rejects a mismatched browser amount. A user-ID debug log was removed from token refresh.

## I. Performance improvements

Order status reads no longer use a day-long Redis cache that could present stale data. Frontend image optimization remains enabled. The customer app now points Turbopack/output tracing at its own package root to avoid ambiguous monorepo inference. No benchmark or production load test was run.

## J. Checkout improvements

A session-stable UUID checkout key is sent to the backend. The order model has a globally unique sparse key; retry lookup also checks the customer. Shipping uses cart-derived weight and a current EasyParcel quote; the browser quote is refreshed when address/cart changes. Cart cleanup is attempted before downstream notifications. Staging still must verify actual provider quote shape, taxes/business pricing rules, the new index, inventory contention, retries, and order/cart state after failures.

## K. Payment flow improvements

No payment processor is integrated into the active checkout, so there is no payment authorization, capture, refund, or payment webhook to harden or test. The storefront now accurately describes COD. Do not describe card, wallet, FPX, or payment sandbox flows as implemented.

## L. Order automation improvements

Once an order is persisted, a cache, task, notification, or broadcast failure is logged without telling the customer that order creation failed. This avoids encouraging a duplicate retry. There is still no durable job, retry policy, or staff-visible failed-automation state; that is a release risk.

## M. Webhook improvements

No active checkout payment webhook was found in the traced COD flow, so none was changed. EasyParcel/tracking callbacks and any other external event consumers require a separate event-ID/idempotency audit.

## N. Database integrity improvements

The checkout key has a unique sparse compound index. Backend startup waits for model initialization so the index is ready before accepting checkout traffic. The application rolls back stock decrements when order creation fails. Stock update plus order write is not yet a MongoDB transaction, and the unique-index build has not been tested on staging data.

## O. Error handling improvements

The quote API returns a failure status when shipping is unavailable. A stale quote returns 409 so the customer can review a new total. Post-order notification, cart-clear, and broadcast failures are logged. Customer-facing retry and disabled states were added.

## P. Monitoring and observability improvements

Order ID is included in post-create failure logs. Existing admin Sentry integration remains. Request correlation, structured checkout events, durable automation outcomes, and staff retry controls remain recommended.

## Q. Tests added and validation

Backend tests cover order ownership/role checks, checkout index presence, CORS origin handling, cart weight and quote parsing, and shipping-price comparison. All 48 backend tests pass. Backend build, admin build/typecheck, and storefront production build/typecheck pass. Changed customer-facing files have zero ESLint errors; repository-wide storefront lint still fails with 174 errors and 121 warnings. No production database, provider, authenticated E2E, real payment, or full visual-regression test was run.

## R. Dependencies changed

Targeted storefront/admin Next and NextAuth updates and backend package patches were applied with lockfiles. Production `npm audit --omit=dev` reports zero findings in storefront and admin; backend reports two moderate and zero high/critical findings. Changes need staging smoke tests because dependency upgrades can alter runtime behavior.

## S. Database migrations

No destructive migration was run. The MongoDB checkout-key index is a schema change; verify its creation and any existing duplicate keys in staging, then plan rollback before release.

## T. Environment variables

`CORS_ALLOWED_ORIGINS` can add explicit browser origins; existing `FRONTEND_URL` and `ADMIN_APP_URL` are also used. Confirm exact deployed origins in staging. No live environment variable or secret was changed.

## U. Remaining risks

The project is **not verified production-ready**. Highest priorities are authenticated purchase E2E in staging, EasyParcel quote validation, real database idempotency/stock concurrency tests, file upload policy, secret exposure review, durable task/notification recovery, and full frontend lint cleanup. Missing staging credentials and provider test fixtures prevented the critical customer journey from being completed safely.

## V. Recommended future improvements

Add a staff-visible order automation status with retryable jobs, define an allowlist and scanning/quarantine policy for artwork, move stock and order writes into a transaction or equivalent reservation design, add realistic purchase and failure E2E tests, validate marketing claims, and work down the lint baseline module by module. Review product-specific metadata, image alt text, and accessibility with automated and manual checks.

## W. Production deployment checklist

1. Review the diff and remove unrelated local files from any release.
2. Use a staging MongoDB snapshot or fixture data; validate index creation, old-order compatibility, and rollback.
3. Exercise owner/staff authorization with real sessions and distinct customer accounts.
4. Test EasyParcel quote and purchase at real Malaysian addresses using test accounts; compare subtotal, quote, and persisted total.
5. Repeat checkout submission concurrently and after a simulated network timeout; verify one order and correct stock/cart state.
6. Simulate task, notification, Redis, and S3 failures; confirm staff can detect and recover them.
7. Validate the storefront at desktop, tablet, and mobile widths, including authenticated cart and checkout, keyboard navigation, and screen reader basics.
8. Clear the repository-wide lint gate and run CI, production builds, typechecks, backend tests, and new E2E tests.
9. Confirm allowed browser origins and audit tracked secret material through the appropriate owner-led rotation process.
10. Obtain explicit approval before production deployment; monitor order creation, quotes, task creation, and error rates after release.
