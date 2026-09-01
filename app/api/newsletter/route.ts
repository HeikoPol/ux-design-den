import { getNewsletterStore } from "../../../lib/newsletter";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Generous per-IP ceiling: a meetup crowd on venue wifi shares one IP, so this
// only has to stop scripted floods. In-memory is fine for the single-process
// standalone server; it resets on restart.
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const signupLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (signupLog.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    signupLog.set(ip, hits);
    return true;
  }
  hits.push(now);
  signupLog.set(ip, hits);
  if (signupLog.size > 10_000) {
    for (const [key, times] of signupLog) {
      if (times.every((t) => now - t >= RATE_WINDOW_MS)) signupLog.delete(key);
    }
  }
  return false;
}

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ message: "Please submit a valid email address." }, { status: 415 });
    }

    const body = (await request.json()) as { email?: unknown; name?: unknown; website?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    // Honeypot: the hidden "website" field is never filled by people. Answer
    // as if the signup worked so bots learn nothing.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return Response.json(
        { message: "Almost there — check your inbox to confirm." },
        { status: 201, headers: { "Cache-Control": "no-store" } },
      );
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return Response.json(
        { message: "Too many signups right now. Please try again later." },
        { status: 429, headers: { "Cache-Control": "no-store" } },
      );
    }

    const store = await getNewsletterStore();
    const { alreadySubscribed } = await store.subscribe(email, "website", name || undefined);

    return Response.json(
      {
        message: alreadySubscribed
          ? "You’re already on the list."
          : "Almost there — check your inbox to confirm.",
      },
      { status: alreadySubscribed ? 200 : 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { message: "We couldn’t add you right now. Please try again." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
