# UX Den — uxden.ca

Website for the UX Den design community in Vancouver, BC. Built with
[vinext](https://github.com/cloudflare/vinext) (Next.js App Router on Vite)
and self-hosted as a plain Node server.

## Prerequisites

- Node.js ≥ 22.13 (Node 24 LTS recommended — see the newsletter note below)

## Development

```bash
npm install
npm run dev
```

## Commands

- `npm run dev` — local development server
- `npm run build` — production build, emits `dist/standalone/`
- `npm run start` — serve the production build (`PORT` and `HOST` env vars, defaults 3000 / 0.0.0.0)
- `npm run lint` — ESLint

## Project layout

- `app/` — pages and components (home, `/privacy`, `/terms`, newsletter API)
- `lib/newsletter.ts` — newsletter subscriber storage
- `public/` — static assets (fonts, event images, OG image)
- `deploy/` — VPS deployment: [deploy/DEPLOY.md](deploy/DEPLOY.md), Caddyfile, systemd unit

## Newsletter storage

Signups from the hero form go through a small storage adapter
(`lib/newsletter.ts`) selected by the `NEWSLETTER_BACKEND` env var:

- `sqlite` (default) — local file via Node's built-in `node:sqlite`, no
  external services. Stable on Node 24; experimental (warning only) on 22/23.
- `listmonk` — subscribes via the self-hosted listmonk on the VPS
  (news.uxden.ca), which owns double opt-in and sending.
- `kit` — subscribes signups to a Kit (kit.com) form via API v4.
- `supabase` — inserts into a Supabase table over its REST API.
- `webhook` — POSTs each signup to any URL (marketing tools, Zapier, ...).

See `.env.example` for the variables each backend needs. Adding another
provider means implementing the two-line `NewsletterStore` interface in
`lib/newsletter.ts`.

## Deployment

The site runs on a VPS behind Caddy with the domain `uxden.ca`. Full
instructions: [deploy/DEPLOY.md](deploy/DEPLOY.md).
