"use client";

import { FormEvent, PointerEvent, useEffect, useRef, useState } from "react";
import { PaperTexture, Warp } from "@paper-design/shaders-react";

const pastEvents = [
  {
    title: "Geek-Out Session: An Improv Night for Designers",
    date: "June 23",
    location: "Northeastern University Vancouver",
    summary:
      "A low-pressure improv session for practicing confidence, speaking up, and connecting with other designers.",
    image: "/events/geek-out.jpg",
    href: "https://luma.com/l3xpha7j",
  },
  {
    title: "The Side-Hustle Blueprint for Designers",
    date: "May 30",
    location: "Northeastern University Vancouver",
    summary:
      "A hands-on workshop for turning design skills and ideas into products, consulting work, and sustainable revenue.",
    image: "/events/side-hustle.jpg",
    href: "https://luma.com/g3izk916",
  },
];

type FormState = "idle" | "submitting" | "success" | "error";

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

export function HomePage() {
  const reducedMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [formState, setFormState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const frame = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.34;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.24;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setPointer({ x, y }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setFormState("submitting");
    setMessage("");
    const form = new FormData(formElement);
    const email = String(form.get("email") ?? "");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Please try again.");
      setFormState("success");
      setMessage(result.message || "You’re on the list.");
      formElement.reset();
    } catch (error) {
      setFormState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="wordmark" href="#top" aria-label="UX Design Den home">
          UX DESIGN DEN
        </a>
        <nav aria-label="Primary navigation">
          <a href="#events">Events</a>
          <a href="#newsletter">Newsletter</a>
          <a href="https://www.linkedin.com/groups/16579023/" target="_blank" rel="noreferrer">
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main id="top">
        <section
          className="hero"
          aria-labelledby="hero-title"
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setPointer({ x: 0, y: 0 })}
        >
          <div className="hero-art" aria-hidden="true">
            <img src="/events/community-room.jpg" alt="" />
            <div className="hero-shader">
              <Warp
                width="100%"
                height="100%"
                colors={["#160d10", "#f15e47", "#6ed1c8", "#261015"]}
                proportion={0.52}
                softness={0.7}
                distortion={0.3}
                swirl={0.46}
                swirlIterations={7}
                shape="edge"
                shapeScale={0.5}
                rotation={-11}
                scale={1.08}
                offsetX={pointer.x}
                offsetY={pointer.y}
                speed={reducedMotion ? 0 : 0.16}
                maxPixelCount={1500000}
              />
            </div>
            <div className="paper-layer">
              <PaperTexture
                width="100%"
                height="100%"
                colorFront="#ead9bd"
                colorBack="#241115"
                contrast={0.38}
                roughness={0.56}
                fiber={0.48}
                fiberSize={0.4}
                crumples={0.18}
                crumpleSize={0.55}
                folds={0.08}
                foldCount={4}
                drops={0.22}
                fade={0.25}
                seed={17}
                speed={0}
                maxPixelCount={900000}
              />
            </div>
          </div>

          <div className="hero-content">
            <p className="hero-kicker">Vancouver, BC · A community for curious designers</p>
            <h1 id="hero-title">Welcome to the Den</h1>
            <div className="hero-lower">
              <p className="mission">
                A low-pressure place for designers and design-adjacent people to learn, practice, and grow.
              </p>

              <div className="newsletter" id="newsletter">
                <div className="newsletter-heading">
                  <h2>Hear about the next gathering</h2>
                  <p>Occasional event news. Nothing noisy.</p>
                </div>
                <form onSubmit={handleSubmit} noValidate>
                  <label htmlFor="newsletter-email">Email address</label>
                  <div className="form-row">
                    <input
                      id="newsletter-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      aria-describedby="form-status"
                      disabled={formState === "submitting"}
                    />
                    <button type="submit" disabled={formState === "submitting"}>
                      {formState === "submitting" ? "Joining…" : "Join the list"}
                    </button>
                  </div>
                  <p
                    className={`form-status ${formState === "error" ? "is-error" : ""}`}
                    id="form-status"
                    aria-live="polite"
                  >
                    {message}
                  </p>
                </form>
              </div>
            </div>
          </div>
        </section>

        <section className="events-section" id="events" aria-labelledby="events-title">
          <div className="section-heading">
            <p>Events</p>
            <h2 id="events-title">Make something. Meet someone.</h2>
          </div>

          <article className="upcoming-row">
            <div className="row-number" aria-hidden="true">01</div>
            <div className="upcoming-copy">
              <p className="event-type">Next event</p>
              <h3>We’re planning the next one.</h3>
              <p>Follow the Luma calendar and be first to know when a new workshop lands.</p>
            </div>
            <a className="text-link" href="https://luma.com/UXDD" target="_blank" rel="noreferrer">
              View Luma calendar <span aria-hidden="true">↗</span>
            </a>
          </article>

          <div className="past-heading">
            <p>Recent sessions</p>
            <span>02 gatherings</span>
          </div>

          <div className="event-grid">
            {pastEvents.map((event, index) => (
              <article className="event-card" key={event.href}>
                <a
                  className="event-image-link"
                  href={event.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${event.title} on Luma`}
                >
                  <img src={event.image} alt={`Event artwork for ${event.title}`} />
                  <span className="event-index" aria-hidden="true">0{index + 2}</span>
                </a>
                <div className="event-details">
                  <p className="event-meta">{event.date} · {event.location}</p>
                  <h3>
                    <a href={event.href} target="_blank" rel="noreferrer">{event.title}</a>
                  </h3>
                  <p>{event.summary}</p>
                  <a className="text-link" href={event.href} target="_blank" rel="noreferrer">
                    Event details <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <p>UX Design Den</p>
        <div className="footer-links">
          <a href="mailto:uxdesignden-bc@gmail.com">uxdesignden-bc@gmail.com</a>
          <a href="https://www.linkedin.com/groups/16579023/" target="_blank" rel="noreferrer">
            LinkedIn group <span aria-hidden="true">↗</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
