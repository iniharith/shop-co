# Production Operations

## Deployment Checklist

1. Confirm the latest GitHub Actions `CI` run passed for the deployed commit.
2. Set `MONGO_URI`, AWS credentials, Redis configuration, and application secrets in the deployment platform.
3. Configure backend `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, and `SENTRY_RELEASE`.
4. Configure the admin Sentry variables documented in `admin/env.example`.
5. Deploy the backend and admin from the same immutable Git commit.
6. Confirm `/health/live` returns 200 and `/health/ready` reports the database as `up`.

## Credential Rotation

MongoDB credentials were previously committed to this public repository. Removing them from current files does not remove them from Git history. Rotate the exposed MongoDB user/password immediately, revoke the old credentials, and update `MONGO_URI` in every deployment environment before the next release.

## Legacy Task History

Preview the number of legacy tasks that need an initial history entry:

```bash
npm run backfill:task-history
```

Apply the idempotent backfill during a low-traffic maintenance window:

```bash
npm run backfill:task-history -- --apply
```

The script requires `MONGO_URI`, changes only tasks with missing or empty history, and is safe to preview repeatedly. Backfilled snapshots remain marked as estimated; only future recorded transitions are treated as historical facts.
Run `npm run build` first when operating from a source checkout without an up-to-date `dist` directory.

## Post-Deploy Smoke Test

- Open Tasks and load another cursor page.
- Save and reapply one view on Tasks, Orders, Production, and Packaging.
- Move a non-delivered status, then use Undo.
- Archive an order, then use Undo.
- Soft-delete a task, then restore it with Undo.
- Open Queue Analytics and confirm its data-quality label.
- Trigger a controlled non-production Sentry test before enabling alerts.

## Monitoring

- Alert on repeated HTTP 5xx events, fatal process exits, and readiness failures.
- Track request IDs from API responses through structured backend logs and Sentry.
- Review Queue Analytics fallback counts; they should trend toward zero as new recorded transitions replace legacy estimates.
- Review `npm audit --omit=dev` during dependency updates and do not apply forced breaking fixes without testing.
