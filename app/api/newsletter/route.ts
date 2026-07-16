import { env } from "cloudflare:workers";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ message: "Please submit a valid email address." }, { status: 415 });
    }

    const body = (await request.json()) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    await env.DB.prepare(
      "CREATE TABLE IF NOT EXISTS newsletter_subscribers (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, source TEXT NOT NULL DEFAULT 'website', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
    ).run();

    const result = await env.DB.prepare(
      "INSERT OR IGNORE INTO newsletter_subscribers (email, source) VALUES (?, ?)",
    )
      .bind(email, "website")
      .run();

    const alreadySubscribed = result.meta.changes === 0;
    return Response.json(
      { message: alreadySubscribed ? "You’re already on the list." : "You’re on the list." },
      { status: alreadySubscribed ? 200 : 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { message: "We couldn’t add you right now. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
