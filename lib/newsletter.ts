/**
 * Newsletter subscriber storage, selected via the NEWSLETTER_BACKEND env var:
 *
 *   sqlite   (default) — local SQLite file, no external services. Set
 *              NEWSLETTER_DB_PATH to change the location (default
 *              ./data/newsletter.db, created on first write).
 *   supabase — inserts into a `newsletter_subscribers` table via the Supabase
 *              REST API. Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 *              The table needs a unique constraint on `email`.
 *   webhook  — POSTs { email, source } as JSON to NEWSLETTER_WEBHOOK_URL, for
 *              marketing tools / automation platforms. Optional
 *              NEWSLETTER_WEBHOOK_AUTH is sent as the Authorization header.
 */

export interface SubscribeResult {
  alreadySubscribed: boolean;
}

export interface NewsletterStore {
  subscribe(email: string, source: string): Promise<SubscribeResult>;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Newsletter backend misconfigured: ${name} is not set.`);
  }
  return value;
}

async function createSqliteStore(): Promise<NewsletterStore> {
  const { DatabaseSync } = await import("node:sqlite");
  const { mkdirSync } = await import("node:fs");
  const { dirname, resolve } = await import("node:path");

  const dbPath = resolve(process.env.NEWSLETTER_DB_PATH ?? "data/newsletter.db");
  mkdirSync(dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec(
    `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL DEFAULT 'website',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
  );

  const insert = db.prepare(
    "INSERT OR IGNORE INTO newsletter_subscribers (email, source) VALUES (?, ?)",
  );

  return {
    async subscribe(email, source) {
      const result = insert.run(email, source);
      return { alreadySubscribed: result.changes === 0 };
    },
  };
}

function createSupabaseStore(): NewsletterStore {
  const url = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  return {
    async subscribe(email, source) {
      const response = await fetch(`${url}/rest/v1/newsletter_subscribers`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          apikey: key,
          authorization: `Bearer ${key}`,
          prefer: "return=minimal",
        },
        body: JSON.stringify({ email, source }),
      });

      // PostgREST reports a unique-constraint violation as 409.
      if (response.status === 409) {
        return { alreadySubscribed: true };
      }
      if (!response.ok) {
        throw new Error(`Supabase insert failed with status ${response.status}`);
      }
      return { alreadySubscribed: false };
    },
  };
}

function createWebhookStore(): NewsletterStore {
  const url = requireEnv("NEWSLETTER_WEBHOOK_URL");
  const auth = process.env.NEWSLETTER_WEBHOOK_AUTH;

  return {
    async subscribe(email, source) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(auth ? { authorization: auth } : {}),
        },
        body: JSON.stringify({ email, source }),
      });

      if (!response.ok) {
        throw new Error(`Newsletter webhook failed with status ${response.status}`);
      }
      // Generic endpoints can't reliably report duplicates; most marketing
      // tools upsert, so treat every accepted request as a new signup.
      return { alreadySubscribed: false };
    },
  };
}

let store: Promise<NewsletterStore> | undefined;

export function getNewsletterStore(): Promise<NewsletterStore> {
  if (!store) {
    const backend = process.env.NEWSLETTER_BACKEND ?? "sqlite";
    switch (backend) {
      case "sqlite":
        store = createSqliteStore();
        break;
      case "supabase":
        store = Promise.resolve(createSupabaseStore());
        break;
      case "webhook":
        store = Promise.resolve(createWebhookStore());
        break;
      default:
        throw new Error(`Unknown NEWSLETTER_BACKEND: ${backend}`);
    }
  }
  return store;
}
