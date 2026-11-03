# Shop-Co private admin monitor

Run this as one independent, always-on Node 20+ service, separate from the Shop-Co backend. Run `npm ci` in this directory. Only one process may poll a given Telegram bot token. Create a **new** bot through BotFather; do not reuse the customer bot. Never commit secrets. A Dockerfile is included; set its build context to this directory.

Set these environment variables in the hosting provider's secret settings:

- `ADMIN_BOT_TOKEN`: new bot token.
- `ADMIN_TELEGRAM_USER_ID`: numeric Telegram user ID permitted to issue commands.
- `ADMIN_TELEGRAM_CHAT_ID`: numeric private chat ID for alerts. Start a private chat with the bot first; retrieve IDs securely via Telegram's `getUpdates` API without sharing the token. Do not use a group.
- `ADMIN_REPORT_MONGO_URI`: MongoDB URI for a read-only user with access only to `auditlogs` and `tasks` in the `shop-co` database.
- `ADMIN_REPORT_ACTOR_ID`: HARITH's Shop-Co user ID.
- `ADMIN_REPORT_DB`: optional database name, defaults to `shop-co`.
- `MONITOR_URLS`: comma-separated HTTPS endpoints. Set actual production URLs explicitly; include admin, storefront, and backend readiness endpoint.
- `SENTRY_ORG_SLUG` and `SENTRY_READ_TOKEN`: optional Sentry organization slug and a read-only token with access to its issue list. The monitor polls `sentry.io` for the 100 most recently updated unresolved issues every five minutes. It takes a baseline at startup, then alerts on new issue IDs; existing issues, regressions of already-seen IDs, resolved issues, events beyond the first 100, and issues created while the monitor is offline may not produce alerts. No stack traces or event payloads are sent.

Start with `npm start` in this directory. The process checks every five minutes and alerts on changes. `/status` checks immediately; `/uploads` and `/uploads YYYY-MM-DD` list distinct tasks with recorded file-add audit events, in Malaysia time. This is activity, not proof of completed work; tasks deleted from the database cannot be titled. The monitor's own hosting and Telegram must be available for alerts; use an independent uptime service to monitor the monitor. Restart resets the prior status.

WhatsApp is not configured here. Business-initiated alerts generally need a configured WhatsApp Business Platform account and approved templates; never reuse a customer-facing webhook without authenticated routing and access controls.

Sentry alerts depend on Sentry being enabled and capturing errors in each deployed application; a healthy homepage does not prove every feature works. Add targeted checks and Sentry alert rules for important workflows, and monitor the monitor independently. This service cannot detect every bug or issue.
