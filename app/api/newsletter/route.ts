import { getNewsletterStore } from "../../../lib/newsletter";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    if (!request.headers.get("content-type")?.includes("application/json")) {
      return Response.json({ message: "Please submit a valid email address." }, { status: 415 });
    }

    const body = (await request.json()) as { email?: unknown; name?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";

    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    const store = await getNewsletterStore();
    const { alreadySubscribed } = await store.subscribe(email, "website", name || undefined);

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
