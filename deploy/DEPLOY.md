# Deploying uxden.ca to the VPS

The site builds to a self-contained Node bundle (`dist/standalone/`) and runs
behind a reverse proxy that terminates TLS. These steps assume a Debian/Ubuntu
VPS with root access; adjust paths and package commands for other distros.

## 1. DNS

At your domain registrar, point the domain at the VPS:

| Type | Name | Value          |
| ---- | ---- | -------------- |
| A    | `@`  | `<VPS IPv4>`   |
| A    | `www`| `<VPS IPv4>`   |

Add matching `AAAA` records if the VPS has IPv6. Wait until
`dig +short uxden.ca` returns the VPS IP before starting Caddy, or
certificate issuance will fail.

## 2. Install Node and Caddy (once)

Use Node 24 LTS — the default newsletter backend uses Node's built-in
`node:sqlite`, which is stable from Node 24 (it works on ≥22.13 but logs an
experimental warning).

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt-get install -y nodejs caddy git
```

## 3. Create the app user and directories (once)

```bash
sudo useradd --system --create-home --home-dir /srv/uxden uxden
sudo -u uxden mkdir -p /srv/uxden/data
sudo -u uxden git clone <your-git-remote> /srv/uxden/app
```

No git remote? `rsync` the project instead (exclude `node_modules`, `dist`,
and `data`).

## 4. Configure and build

```bash
sudo -u uxden cp /srv/uxden/app/.env.example /srv/uxden/app/.env
```

Edit `/srv/uxden/app/.env`: keep `NEXT_PUBLIC_SITE_URL=https://uxden.ca`,
and pick the newsletter backend (leave `NEWSLETTER_BACKEND=sqlite` until
Supabase or a marketing tool is chosen — see `lib/newsletter.ts`). Then:

```bash
cd /srv/uxden/app && sudo -u uxden npm ci && sudo -u uxden npm run build
```

`NEXT_PUBLIC_*` variables are baked in at build time, so rebuild after
changing them. Backend variables (`NEWSLETTER_*`, `SUPABASE_*`) are read at
runtime — a service restart is enough.

## 5. Run under systemd, proxy with Caddy

```bash
sudo cp /srv/uxden/app/deploy/uxden.service /etc/systemd/system/uxden.service && sudo systemctl enable --now uxden
```

The VPS's Caddy is shared with other sites, so uxden.ca is a snippet imported
by the main Caddyfile rather than a full replacement:

```bash
sudo cp /srv/uxden/app/deploy/uxden.caddy /etc/caddy/uxden.caddy && sudo sh -c 'grep -q "import uxden.caddy" /etc/caddy/Caddyfile || echo "import uxden.caddy" >> /etc/caddy/Caddyfile' && sudo systemctl reload caddy
```

Caddy fetches the TLS certificates for `uxden.ca` and `www.uxden.ca` on first
request and renews them automatically. Then verify:

```bash
curl -sI https://uxden.ca | head -3
```

## 6. Redeploying updates

```bash
cd /srv/uxden/app && sudo -u uxden git pull && sudo -u uxden npm ci && sudo -u uxden npm run build && sudo systemctl restart uxden
```

Signups are safe across redeploys: the database lives in
`/srv/uxden/data/newsletter.db` (set in `uxden.service`), outside the app
directory. Back it up with a simple copy, and export subscribers with:

```bash
sudo -u uxden node -e "const{DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('/srv/uxden/data/newsletter.db');for(const r of db.prepare('SELECT email,created_at FROM newsletter_subscribers ORDER BY created_at').all())console.log(r.email+','+r.created_at)"
```

## 7. Newsletter: listmonk, Resend, bounces

Production sends through **listmonk** on this VPS. The sqlite notes above only
apply when `NEWSLETTER_BACKEND=sqlite`; the live `.env` holds:

```
NEWSLETTER_BACKEND=listmonk
LISTMONK_URL=http://127.0.0.1:9000
LISTMONK_LIST_UUID=14c426e5-882e-4ff0-81b5-5a91b8ac7bf3
```

listmonk runs from `/srv/listmonk` under `listmonk.service` on `127.0.0.1:9000`,
backed by a Postgres database of the same name, published at **news.uxden.ca**
by the `/etc/caddy/listmonk.caddy` snippet. Admin credentials are in
`/root/.listmonk-admin-pass`.

### Sending (Resend)

listmonk → Settings → SMTP: `smtp.resend.com` port 587, STARTTLS, username
`resend`, password a Resend API key. The domain is verified in Resend via DNS
records on **subdomains** at SiteGround (`send.uxden.ca`, `resend._domainkey`).
The root `MX` and root SPF belong to SiteGround's mail hosting and must never be
repointed at a sending provider — they are what receives `hello@uxden.ca`.

### The opt-in email

The confirmation email is
`/srv/listmonk/static/email-templates/subscriber-optin.html`. listmonk's system
email templates are **files on disk, not database rows**, and are read once at
startup — edit, then `systemctl restart listmonk`, or the old copy keeps going
out. Ignore `/srv/listmonk/static/static/`: a leftover copy of the stock release
assets that nothing reads.

### Bounce handling

Resend reports bounces only over webhooks and listmonk has no native Resend
handler, so `resend-bounce-adapter.mjs` bridges the two. Mailbox scanning is not
an option here — the return path is `send.uxden.ca`, so Resend catches every
bounce and nothing arrives at `hello@uxden.ca` to poll.

```bash
sudo install -o listmonk -g listmonk -m 644 /srv/uxden/app/deploy/resend-bounce-adapter.mjs /srv/listmonk/resend-bounce-adapter.mjs && sudo install -m 644 /srv/uxden/app/deploy/resend-bounce.service /etc/systemd/system/resend-bounce.service && sudo systemctl daemon-reload && sudo systemctl enable --now resend-bounce
```

Three secrets go in `/etc/resend-bounce.env`, mode 600:

```
RESEND_WEBHOOK_SECRET=whsec_...
LISTMONK_API_USER=resend-bounce
LISTMONK_API_TOKEN=...
```

Create the API user in listmonk under Admin → Users with type **API**, and give
its role only `webhooks:post_bounce` — never reuse the `uxden` Super Admin. The
signing secret is on the Resend webhook's detail page; that webhook points at
`https://news.uxden.ca/resend-bounce` and subscribes to `email.bounced` and
`email.complained`. The Caddy snippet routes that one path to `127.0.0.1:9001`
and everything else to listmonk.

To test, sign up a nonexistent mailbox on a *real* domain — e.g.
`no-such-mailbox-9f3a@uxden.ca`, which SiteGround rejects with a 550. A
`.invalid` address produces no event at all, and Resend has no mailbox simulator
like SES did.

```bash
sudo -u postgres psql -d listmonk -c "SELECT id, subscriber_id, type, source FROM bounces ORDER BY id DESC LIMIT 5;"
```

## Troubleshooting

- `systemctl status uxden` / `journalctl -u uxden -e` — app logs.
- `journalctl -u caddy -e` — TLS/proxy issues (usually DNS not propagated yet).
- `journalctl -u listmonk -e` — listmonk, including opt-in send failures.
- `journalctl -u resend-bounce -e` — the bounce adapter. `no svix headers` means
  something that isn't a Resend webhook hit the endpoint; `signature mismatch`
  means `RESEND_WEBHOOK_SECRET` doesn't match the one on the Resend webhook.
- Port 3002 is bound to `127.0.0.1` only; the site is reachable exclusively
  through Caddy. (3000 and 3001 belong to the other sites on this VPS.)
