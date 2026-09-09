/**
 * Translates Resend bounce/complaint webhooks into listmonk bounce records.
 *
 * Resend reports bounces only over webhooks, and listmonk ships native handlers
 * for SES/SendGrid/Postmark/Forward Email/Lettermint/Azure — but not Resend. So
 * this sits between the two: it verifies Resend's Svix signature, maps the event
 * onto listmonk's bounce vocabulary, and posts it to /webhooks/bounce.
 *
 * Runs under systemd as resend-bounce.service, behind the news.uxden.ca Caddy
 * block at /resend-bounce. Secrets come from /etc/resend-bounce.env.
 */

import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}

const PORT = Number(process.env.PORT ?? 9001);
const LISTMONK_URL = (process.env.LISTMONK_URL ?? "http://127.0.0.1:9000").replace(/\/$/, "");
const SIGNING_SECRET = requireEnv("RESEND_WEBHOOK_SECRET");
const API_AUTH = `Basic ${Buffer.from(
  `${requireEnv("LISTMONK_API_USER")}:${requireEnv("LISTMONK_API_TOKEN")}`,
).toString("base64")}`;

// Svix rejects replays outside five minutes; match that.
const TOLERANCE_MS = 5 * 60 * 1000;
const MAX_BODY_BYTES = 64 * 1024;

/**
 * Checks Resend's Svix signature over `${id}.${timestamp}.${body}`.
 * Returns null when valid, else a reason — worth distinguishing, because an
 * unsigned request (a scanner, or a curl health check) looks nothing like a
 * genuine webhook whose signature failed, and conflating them wastes an hour.
 */
function signatureProblem(headers, body) {
  const id = headers["svix-id"];
  const timestamp = headers["svix-timestamp"];
  const signatures = headers["svix-signature"];
  if (!id || !timestamp || !signatures) return "no svix headers — not a Resend webhook";

  const age = Date.now() - Number(timestamp) * 1000;
  if (!Number.isFinite(age)) return "unparseable svix-timestamp";
  if (Math.abs(age) > TOLERANCE_MS) {
    return `timestamp ${Math.round(age / 1000)}s out — check server clock`;
  }

  const key = Buffer.from(SIGNING_SECRET.replace(/^whsec_/, ""), "base64");
  const expected = Buffer.from(
    createHmac("sha256", key)
      .update(Buffer.concat([Buffer.from(`${id}.${timestamp}.`), body]))
      .digest("base64"),
  );

  // The header carries space-separated "v1,<signature>" pairs; any match passes.
  const matched = signatures.split(" ").some((entry) => {
    const candidate = Buffer.from(entry.split(",")[1] ?? "");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });

  return matched ? null : "signature mismatch — wrong signing secret?";
}

/** Maps a Resend event onto a listmonk bounce, or null for events we ignore. */
function toBounce(event) {
  const email = event?.data?.to?.[0];
  if (!email) return null;

  if (event.type === "email.complained") return { email, type: "complaint" };
  if (event.type === "email.bounced") {
    // Resend reports Permanent / Transient / Undetermined. Only Permanent is a
    // hard bounce; treating the other two as soft lets listmonk's soft-bounce
    // threshold decide, rather than blocklisting on a temporary failure.
    const kind = event?.data?.bounce?.type;
    return { email, type: kind === "Permanent" ? "hard" : "soft" };
  }
  return null;
}

async function recordBounce(bounce, event) {
  const response = await fetch(`${LISTMONK_URL}/webhooks/bounce`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: API_AUTH },
    body: JSON.stringify({
      email: bounce.email,
      source: "resend",
      type: bounce.type,
      meta: JSON.stringify({
        resend_email_id: event?.data?.email_id,
        bounce: event?.data?.bounce,
      }),
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`listmonk answered ${response.status}: ${detail}`);
  }
}

createServer((req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405).end();
    return;
  }

  // Collected as Buffers, not a string: the signature covers the exact bytes,
  // and appending Buffers to a string decodes each chunk separately, which
  // corrupts any multi-byte character straddling a chunk boundary.
  const chunks = [];
  let size = 0;
  let oversized = false;
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      oversized = true;
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on("end", async () => {
    if (oversized) return;
    const body = Buffer.concat(chunks);

    const problem = signatureProblem(req.headers, body);
    if (problem) {
      console.error(`rejected webhook: ${problem}`);
      res.writeHead(401).end();
      return;
    }

    let event;
    try {
      event = JSON.parse(body);
    } catch {
      res.writeHead(400).end();
      return;
    }

    const bounce = toBounce(event);
    if (!bounce) {
      // Deliveries, opens and the rest all land here. Ack so Resend stops.
      res.writeHead(204).end();
      return;
    }

    try {
      await recordBounce(bounce, event);
      console.log(`recorded ${bounce.type} for ${bounce.email}`);
      res.writeHead(200).end();
    } catch (err) {
      // 5xx makes Resend retry, which is what we want for a transient listmonk
      // or network failure — the alternative is silently losing the bounce.
      console.error(`failed to record ${bounce.type} for ${bounce.email}: ${err.message}`);
      res.writeHead(500).end();
    }
  });
}).listen(PORT, "127.0.0.1", () => {
  console.log(`resend-bounce adapter listening on 127.0.0.1:${PORT}`);
});
