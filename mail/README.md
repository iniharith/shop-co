# Kampung Cetak — Self-hosted Email

Self-hosted `@kampungcetak.com` mail using [docker-mailserver](https://docker-mailserver.github.io/)
(Postfix + Dovecot) running on the VPS, with a custom webmail UI served at
`email.kampungcetak.com` (built into the Next.js frontend).

## Architecture

```
Internet ── SMTP:25 ──▶ mailserver container (VPS 64.29.17.1)
   │                         │
   │                    Postfix (receive) + Dovecot (IMAP)
   │                         │
   │                         ▼
Webmail UI (email.kampungcetak.com, Vercel)
   │  HTTPS /api/mail/*          │
   └────────────────────────▶ Express backend (VPS)
                              imapflow + nodemailer ──▶ IMAP:993 / SMTP:587
```

The browser cannot talk IMAP directly, so the Express backend acts as a mail
bridge: it verifies credentials, lists folders/messages, reads and sends mail
through the mail server.

## Deploy the mail server

```bash
# 1. Get a TLS cert for mail.kampungcetak.com first (needed by SSL_TYPE=letsencrypt)
#    On the VPS with certbot:
sudo certbot certonly --standalone -d mail.kampungcetak.com

# 2. Make sure ports 25 / 465 / 587 / 993 are open in the firewall,
#    and that your VPS provider does NOT block port 25 (check with them).

# 3. Start the server
docker compose -f mail/docker-compose.yml up -d

# 4. Create the first mailbox
docker compose -f mail/docker-compose.yml run --rm mailserver setup email add \
  support@kampungcetak.com

# 5. Create a postmaster alias
docker compose -f mail/docker-compose.yml run --rm mailserver setup alias add \
  postmaster@kampungcetak.com support@kampungcetak.com

# 6. Print the DKIM keys (put the TXT record below into DNS)
docker exec mailserver setup config dkim

# 7. (Optional) List/manage accounts
docker compose -f mail/docker-compose.yml run --rm mailserver setup email list
```

## DNS records (in your domain registrar / DNS panel)

| Type | Name                 | Value                                              |
|------|----------------------|----------------------------------------------------|
| A    | mail                 | `64.29.17.1`                                        |
| A    | email                | `76.76.21.21` (Vercel — add this domain to the frontend project) |
| MX   | @ (root, priority 10)| `mail.kampungcetak.com`                             |
| TXT  | @                    | `v=spf1 mx -all`                                    |
| TXT  | default._domainkey   | (the DKIM record printed by `setup config dkim`)    |
| TXT  | _dmarc               | `v=DMARC1; p=quarantine; rua=mailto:dmarc@kampungcetak.com` |

**IMPORTANT — reverse DNS (PTR):** you must ask your VPS provider to set the
PTR record for `64.29.17.1` → `mail.kampungcetak.com`. Without it, Gmail /
Outlook / Yahoo will almost always treat outgoing mail as spam or reject it.
Wait for the PTR to propagate (24–48h) before sending important mail.

Then wait for DNS to propagate and test:
- `dig MX kampungcetak.com`
- `dig TXT kampungcetak.com`
- `dig -x 64.29.17.1`

## Webmail

The webmail UI lives in the frontend app at `/mail` and is served on
`email.kampungcetak.com`:

1. Add `email.kampungcetak.com` as a domain on the Vercel frontend project.
2. Point that subdomain's A record at Vercel (`76.76.21.21`).
3. Set the backend env vars below, then open `https://email.kampungcetak.com/mail`.

The middleware (`frontend/src/proxy.ts`) redirects `email.kampungcetak.com`
straight to `/mail`. Sign in uses your `@kampungcetak.com` mailbox password;
the webmail authenticates directly against the mail server through the backend
bridge — there is no separate app password or account list to maintain.

### Frontend env var

The frontend needs `NEXT_PUBLIC_BACKEND_URL` pointing at the Express backend
(which hosts `/api/mail`). Set it in the Vercel project settings, e.g.:

```bash
NEXT_PUBLIC_BACKEND_URL=https://admin.kampungcetak.com
```

### Backend env vars (backend/.env)

```bash
MAIL_IMAP_HOST=127.0.0.1
MAIL_IMAP_PORT=993
MAIL_IMAP_SECURE=true
MAIL_SMTP_HOST=127.0.0.1
MAIL_SMTP_PORT=587
MAIL_SMTP_SECURE=false      # STARTTLS on 587
MAIL_JWT_SECRET=<random long string>
```

The backend exposes these endpoints (all under `/api/mail`):

| Method | Path                                  | Purpose                      |
|--------|---------------------------------------|------------------------------|
| POST   | `/api/mail/login`                     | Verify IMAP creds → session  |
| POST   | `/api/mail/logout`                    | Invalidate session           |
| GET    | `/api/mail/me`                        | Current mailbox              |
| GET    | `/api/mail/folders`                   | List IMAP folders            |
| GET    | `/api/mail/messages?folder=&page=`    | Message list (envelope)      |
| GET    | `/api/mail/messages/:uid?folder=`     | Full message (parsed)        |
| PATCH  | `/api/mail/messages/:uid`             | Mark seen / move / flag      |
| DELETE | `/api/mail/messages/:uid?folder=`     | Move to Trash                |
| GET    | `/api/mail/attachments/:uid/:part`    | Download attachment          |
| POST   | `/api/mail/send`                      | Send via SMTP                |

## Troubleshooting

- **Port 25 blocked?** Ask the VPS provider to unblock outbound port 25. Without
  it the server can receive but not send mail.
- **Emails going to spam?** Verify PTR + SPF + DKIM + DMARC with
  https://www.mail-tester.com.
- **Mail queue:** `docker exec mailserver postqueue -p`
- **Logs:** `docker logs mailserver`
