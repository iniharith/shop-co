This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the result.

## Deployment environment

Use `env.example` as the deployment variable reference. For Sentry:

- `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, and `NEXT_PUBLIC_SENTRY_RELEASE` configure runtime reporting. Public variables are embedded at build time.
- Set `SENTRY_DSN` for server-side reporting when a public DSN is not supplied.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` are build-only secrets used to upload source maps. Keep them out of browser-visible variables and runtime logs.
- Set `SENTRY_RELEASE` and `NEXT_PUBLIC_SENTRY_RELEASE` to the same immutable deployment identifier, such as the Git commit SHA.
- Source-map upload is disabled automatically when any upload credential is absent; application builds and runtime reporting still work.

Example deployment setup:

```bash
cp env.example .env.local
```
