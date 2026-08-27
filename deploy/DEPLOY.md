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

```bash
sudo cp /srv/uxden/app/deploy/Caddyfile /etc/caddy/Caddyfile && sudo systemctl reload caddy
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

## Troubleshooting

- `systemctl status uxden` / `journalctl -u uxden -e` — app logs.
- `journalctl -u caddy -e` — TLS/proxy issues (usually DNS not propagated yet).
- Port 3000 is bound to `127.0.0.1` only; the site is reachable exclusively
  through Caddy.
