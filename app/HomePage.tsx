"use client";

import {
  FormEvent,
  MouseEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  MeshGradient,
  Metaballs,
  PaperTexture,
  Warp,
} from "@paper-design/shaders-react";
import { AxisCursor } from "./AxisCursor";

const pastEvents = [
  {
    index: "01",
    title: "UXDD Portfolio Review Session",
    shortTitle: "Portfolio Review Session",
    date: "August 26",
    location: "Northeastern University Vancouver",
    summary:
      "Three minutes per portfolio, with real-time feedback from hiring managers and senior designers.",
    href: "https://luma.com/oq43d0wr",
    image: "/events/portfolio-review-live.webp",
    colors: ["#150c0d", "#ed674b", "#f0d85b", "#438ed2"],
    className: "event-row-warm",
  },
  {
    index: "02",
    title: "Geek-Out Session: An Improv Night for Designers",
    shortTitle: "Geek-Out Session",
    date: "June 23",
    location: "Northeastern University Vancouver",
    summary:
      "Improv as a design tool for confidence, connection, and speaking up without the pressure to perform.",
    href: "https://luma.com/l3xpha7j",
    image: "/events/geek-out.webp",
    colors: ["#120d0e", "#65d8cf", "#dd4b96", "#ddea56"],
    className: "event-row-cool",
  },
  {
    index: "03",
    title: "The Side-Hustle Blueprint for Designers",
    shortTitle: "Side-Hustle Blueprint",
    date: "May 30",
    location: "Northeastern University Vancouver",
    summary:
      "A practical workshop for shaping design skills into products, consulting work, and sustainable revenue.",
    href: "https://luma.com/g3izk916",
    image: "/events/side-hustle.jpg",
    colors: ["#150c0d", "#ed674b", "#f0d85b", "#438ed2"],
    className: "event-row-warm",
  },
];

type FormState = "idle" | "submitting" | "success" | "error";
type FormStep = "email" | "name";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function ShaderField({
  colors,
  speed = 0.12,
  offsetX = 0,
  offsetY = 0,
  rotation = 0,
  scale = 1,
}: {
  colors: string[];
  speed?: number;
  offsetX?: number;
  offsetY?: number;
  rotation?: number;
  scale?: number;
}) {
  return (
    <Warp
      width="100%"
      height="100%"
      colors={colors}
      proportion={0.5}
      softness={0.58}
      distortion={0.42}
      swirl={0.54}
      swirlIterations={8}
      shape="edge"
      shapeScale={0.48}
      rotation={rotation}
      scale={scale}
      offsetX={offsetX}
      offsetY={offsetY}
      speed={speed}
      maxPixelCount={1400000}
    />
  );
}

function LiquidField({
  pointer,
  progress,
  reducedMotion,
}: {
  pointer: { x: number; y: number };
  progress: number;
  reducedMotion: boolean;
}) {
  const pointerEnergy = Math.min(
    1,
    Math.hypot(pointer.x / 0.17, pointer.y / 0.12),
  );

  return (
    <div className="liquid-field">
      <div className="liquid-base">
        <MeshGradient
          width="100%"
          height="100%"
          colors={["#130d0f", "#e85f47", "#6bd8ce", "#dce85a", "#b73d80", "#24184d"]}
          distortion={0.72 + pointerEnergy * 0.16}
          swirl={0.62 + pointerEnergy * 0.22}
          grainMixer={0.18}
          grainOverlay={0.035}
          fit="cover"
          scale={1.13 + progress * 0.14}
          rotation={-10 + progress * 15 + pointer.x * 26}
          offsetX={pointer.x * 0.72}
          offsetY={pointer.y * 0.72}
          speed={reducedMotion ? 0 : 0.24}
          maxPixelCount={1400000}
        />
      </div>

      <div className="liquid-response" style={{ opacity: 0.32 + pointerEnergy * 0.28 }}>
        <Metaballs
          width="100%"
          height="100%"
          colorBack="#00000000"
          colors={["#6bd8cecc", "#e85f47bb", "#dce85aaa", "#b73d80b8"]}
          count={11}
          size={0.4 + pointerEnergy * 0.08}
          fit="cover"
          scale={1.08 + pointerEnergy * 0.12}
          rotation={pointer.x * 52 - pointer.y * 24}
          offsetX={pointer.x * 2.7}
          offsetY={pointer.y * 2.7}
          speed={reducedMotion ? 0 : 0.16}
          maxPixelCount={900000}
        />
      </div>
    </div>
  );
}

export function HomePage() {
  const heroRef = useRef<HTMLElement>(null);
  const animationFrame = useRef<number | null>(null);
  const pointerFrame = useRef<number | null>(null);
  const pointerTarget = useRef({ x: 0, y: 0 });
  const pointerPosition = useRef({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [heroProgress, setHeroProgress] = useState(0);
  const [formState, setFormState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [formStep, setFormStep] = useState<FormStep>("email");
  const [pendingEmail, setPendingEmail] = useState("");
  const signupInputRef = useRef<HTMLInputElement>(null);
  const archiveRef = useRef<HTMLElement>(null);
  const eventGridRef = useRef<HTMLDivElement>(null);

  // Vertical wheel input over the archive drives the card strip; once the
  // strip hits either end, the event passes through and the page scrolls on.
  // Touch scrolling never fires wheel events, so phones keep native swiping.
  useEffect(() => {
    const section = archiveRef.current;
    const grid = eventGridRef.current;
    if (!section || !grid) return;

    let snapRestore: number | undefined;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const delta = event.deltaMode === 1 ? event.deltaY * 32 : event.deltaY;
      const max = grid.scrollWidth - grid.clientWidth;
      if (max <= 0) return;
      const atEnd = delta > 0 && grid.scrollLeft >= max - 1;
      const atStart = delta < 0 && grid.scrollLeft <= 0;
      if (atEnd || atStart) return;
      event.preventDefault();
      // Snap fights incremental wheel deltas (it pulls the strip back to the
      // nearest card between ticks); pause it and let it settle afterwards.
      grid.style.scrollSnapType = "none";
      grid.scrollLeft += delta;
      if (snapRestore) window.clearTimeout(snapRestore);
      snapRestore = window.setTimeout(() => {
        grid.style.scrollSnapType = "";
      }, 300);
    };

    section.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      section.removeEventListener("wheel", onWheel);
      if (snapRestore) window.clearTimeout(snapRestore);
    };
  }, []);

  useEffect(() => {
    const update = () => {
      animationFrame.current = null;
      const hero = heroRef.current;
      if (!hero || reducedMotion) {
        setHeroProgress(0);
        return;
      }
      const rect = hero.getBoundingClientRect();
      const range = Math.max(1, hero.offsetHeight - window.innerHeight);
      const next = Math.min(1, Math.max(0, -rect.top / range));
      setHeroProgress(next);
    };

    const onScroll = () => {
      if (animationFrame.current === null) {
        animationFrame.current = requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    };
  }, [reducedMotion]);

  useEffect(() => {
    return () => {
      if (pointerFrame.current !== null) cancelAnimationFrame(pointerFrame.current);
    };
  }, []);

  function easePointerToTarget() {
    if (reducedMotion || pointerFrame.current !== null) return;

    const tick = () => {
      const current = pointerPosition.current;
      const target = pointerTarget.current;
      const next = {
        x: current.x + (target.x - current.x) * 0.14,
        y: current.y + (target.y - current.y) * 0.14,
      };
      pointerPosition.current = next;
      setPointer(next);

      if (Math.abs(target.x - next.x) + Math.abs(target.y - next.y) > 0.0005) {
        pointerFrame.current = requestAnimationFrame(tick);
      } else {
        pointerPosition.current = target;
        setPointer(target);
        pointerFrame.current = null;
      }
    };

    pointerFrame.current = requestAnimationFrame(tick);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (reducedMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerTarget.current = {
      x: ((event.clientX - rect.left) / rect.width - 0.5) * 0.34,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * 0.24,
    };
    easePointerToTarget();
  }

  function handlePointerLeave() {
    pointerTarget.current = { x: 0, y: 0 };
    easePointerToTarget();
  }

  function handleNewsletterNav(event: MouseEvent<HTMLAnchorElement>) {
    const hero = heroRef.current;
    if (!hero) return;
    // The signup panel lives inside the sticky hero, so native anchor
    // scrolling overshoots past the stage. Land at full hero entry instead,
    // which keeps the nav and intro line in view above the panel.
    event.preventDefault();
    window.scrollTo({
      top: Math.max(0, hero.offsetTop + hero.offsetHeight - window.innerHeight),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  function handleEmailInput() {
    if (formState === "error") {
      setFormState("idle");
      setMessage("");
    }
  }

  const lastStepRef = useRef<FormStep>("email");
  useEffect(() => {
    if (lastStepRef.current === formStep) return;
    lastStepRef.current = formStep;
    const input = signupInputRef.current;
    if (!input) return;
    // Coming back via Edit restores the email; the fresh name field starts empty.
    if (formStep === "email" && pendingEmail) input.value = pendingEmail;
    input.focus();
  }, [formStep, pendingEmail]);

  function handleEditEmail() {
    setFormStep("email");
    setFormState("idle");
    setMessage("");
  }

  const wasSuccessRef = useRef(false);
  useEffect(() => {
    if (wasSuccessRef.current && formState === "idle") signupInputRef.current?.focus();
    wasSuccessRef.current = formState === "success";
  }, [formState]);

  function handleResetSignup() {
    setFormState("idle");
    setMessage("");
    setPendingEmail("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    if (formStep === "email") {
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
        setFormState("error");
        setMessage("Please enter a valid email address.");
        return;
      }
      setPendingEmail(email);
      setFormState("idle");
      setMessage("");
      setFormStep("name");
      return;
    }

    const name = String(form.get("name") ?? "").trim().slice(0, 100);
    const website = String(form.get("website") ?? "");
    setFormState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, name, website }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Please try again.");
      // Keep pendingEmail for the success view; handleResetSignup clears it.
      setFormState("success");
      setMessage(result.message || "You’re on the list.");
      setFormStep("email");
    } catch (error) {
      setFormState("error");
      setMessage(error instanceof Error ? error.message : "Please try again.");
    }
  }

  const titleShift = reducedMotion ? 0 : heroProgress * 46;
  const portalScale = reducedMotion ? 1 : 1 + heroProgress * 0.36;
  const portalRotation = reducedMotion ? -4 : -4 + heroProgress * 9;

  return (
    <div className="site-shell">
      <AxisCursor disabled={reducedMotion} />

      <main>
        <section className="hero-stage" ref={heroRef} id="top">
          <div
            className="hero-sticky"
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
          >
            <header className="hero-nav">
              <a className="wordmark" href="#top" aria-label="UX Den home">
                UX<br />DEN
              </a>
              <p className="nav-signal"><span aria-hidden="true" /> Vancouver, BC</p>
              <nav aria-label="Primary navigation">
                <a href="#newsletter" onClick={handleNewsletterNav}>Newsletter</a>
                <a href="#next">Next</a>
                <a href="#past">Past (03)</a>
              </nav>
            </header>

            <div className="hero-intro">
              <p>Design practice.<br />Without the pressure.</p>
            </div>

            <div className="hero-title-wrap">
              <h1>
                <span style={{ transform: `translate3d(${-titleShift * 0.32}px, ${-titleShift}px, 0)` }}>
                  Welcome
                </span>
                <span style={{ transform: `translate3d(${titleShift * 0.45}px, ${-titleShift * 0.62}px, 0)` }}>
                  to the Den
                </span>
              </h1>
            </div>

            <div className="hero-newsletter" id="newsletter" role="region" aria-labelledby="newsletter-title">
              <h2 id="newsletter-title">Stay Updated</h2>
              <form onSubmit={handleSubmit} noValidate>
                <div className="newsletter-trap" aria-hidden="true">
                  <label htmlFor="newsletter-website">Leave this field empty</label>
                  <input
                    id="newsletter-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                {formState === "success" ? (
                  <div className="newsletter-success" role="status" aria-live="polite">
                    <p className="newsletter-success-message">{message}</p>
                    <p className="newsletter-consent">
                      {pendingEmail}{" — "}
                      <button type="button" className="newsletter-edit" onClick={handleResetSignup}>
                        Add another email
                      </button>
                    </p>
                  </div>
                ) : (
                  <>
                <label htmlFor="newsletter-email">
                  {formStep === "email" ? "Email address" : "First name (optional)"}
                </label>
                <div className="newsletter-form-row">
                  <input
                    key={formStep}
                    ref={signupInputRef}
                    id="newsletter-email"
                    name={formStep === "email" ? "email" : "name"}
                    type={formStep === "email" ? "email" : "text"}
                    inputMode={formStep === "email" ? "email" : "text"}
                    autoComplete={formStep === "email" ? "email" : "given-name"}
                    placeholder={formStep === "email" ? "YOUR EMAIL ADDRESS" : "YOUR FIRST NAME (OPTIONAL)"}
                    required={formStep === "email"}
                    aria-describedby="newsletter-consent form-status"
                    onChange={handleEmailInput}
                    disabled={formState === "submitting"}
                  />
                  <button type="submit" disabled={formState === "submitting"}>
                    {formState === "submitting"
                      ? "JOINING…"
                      : formStep === "email"
                        ? "COUNT ME IN ↗"
                        : "JOIN THE DEN ↗"}
                  </button>
                </div>
                <p className="newsletter-consent" id="newsletter-consent">
                  {formStep === "name" ? (
                    <>
                      Signing up as {pendingEmail}.{" "}
                      <button type="button" className="newsletter-edit" onClick={handleEditEmail}>
                        Edit
                      </button>
                    </>
                  ) : (
                    <>
                      Occasional UX Den updates. Unsubscribe anytime. <a href="/privacy">Privacy</a>
                    </>
                  )}
                </p>
                <p
                  className={`form-status ${formState === "error" ? "is-error" : ""}`}
                  id="form-status"
                  aria-live="polite"
                >
                  {message}
                </p>
                  </>
                )}
              </form>
            </div>

            <div
              className="hero-portal"
              aria-hidden="true"
              style={{ transform: `translateX(-50%) rotate(${portalRotation}deg) scale(${portalScale})` }}
            >
              <LiquidField
                pointer={pointer}
                progress={heroProgress}
                reducedMotion={reducedMotion}
              />

              <div className="portal-paper">
                <PaperTexture
                  width="100%"
                  height="100%"
                  colorFront="#ecdcc1"
                  colorBack="#271216"
                  contrast={0.42}
                  roughness={0.62}
                  fiber={0.58}
                  fiberSize={0.36}
                  crumples={0.28}
                  crumpleSize={0.58}
                  folds={0.14}
                  foldCount={5}
                  drops={0.28}
                  fade={0.24}
                  seed={31}
                  speed={0}
                  maxPixelCount={800000}
                />
              </div>
            </div>

            <p className="hero-count" aria-label={`${Math.round(heroProgress * 100)} percent through introduction`}>
              {String(Math.round(heroProgress * 100)).padStart(2, "0")}<br />/100
            </p>
            <p className="scroll-cue">Scroll to enter <span aria-hidden="true">↓</span></p>
          </div>
        </section>

        <section className="mission-scene" aria-labelledby="mission-title">
          <div className="scene-index">/ MISSION</div>
          <h2 id="mission-title">
            A low-pressure place for designers and design-adjacent people to learn, practice, and grow.
          </h2>
          <p className="mission-note">Curiosity over credentials.</p>
        </section>

        <section className="next-scene" id="next" aria-labelledby="next-title">
          <div className="scene-index">02 / NEXT EVENT</div>
          <p className="next-status"><span aria-hidden="true" /> Next session in the works</p>
          <a
            className="next-event-card"
            href="#newsletter"
            onClick={handleNewsletterNav}
            aria-label="Next event to be announced — join the newsletter to hear first"
          >
            <div className="next-event-media">
              <div className="next-media-shader" aria-hidden="true">
                <ShaderField
                  colors={["#120d0e", "#65d8cf", "#dd4b96", "#ddea56"]}
                  rotation={-14}
                  scale={1.18}
                  speed={reducedMotion ? 0 : 0.1}
                />
              </div>
            </div>
            <div className="next-event-details">
              <p className="next-event-date">DATE &amp; VENUE / TBA</p>
              <h2 id="next-title">To be<br />announced</h2>
              <p className="next-copy">
                The next session is taking shape. Newsletter subscribers hear about it first.
              </p>
              <p className="next-event-location">Vancouver, BC</p>
              <span className="next-event-open">Get notified first <span aria-hidden="true">↗</span></span>
            </div>
          </a>
        </section>

        <section className="archive" id="past" aria-labelledby="archive-title" ref={archiveRef}>
          <div className="archive-head">
            <h2 id="archive-title">Past sessions</h2>
            <p>03 / Vancouver</p>
          </div>

          <div className="event-grid" ref={eventGridRef}>
            {pastEvents.map((event, eventIndex) => (
              <article className={`event-row ${event.className}`} key={event.href}>
                <a href={event.href} target="_blank" rel="noreferrer" aria-label={`${event.title} on Luma`}>
                  <div className="event-row-top">
                    <span>{event.index}</span>
                    <span>{event.date}</span>
                    <span>Vancouver</span>
                  </div>
                  <div className="event-art" aria-hidden="true">
                    <img className="event-art-photo" src={event.image} alt="" loading="lazy" />
                    <div className="event-art-shader">
                      <ShaderField
                        colors={event.colors}
                        rotation={eventIndex === 0 ? -18 : 14}
                        scale={1.1}
                        speed={reducedMotion ? 0 : 0.09 + eventIndex * 0.025}
                      />
                    </div>
                    <div className="event-art-grain" />
                  </div>
                  <div className="event-copy">
                    <h3>{event.shortTitle}</h3>
                    <p>{event.summary}</p>
                  </div>
                  <span className="event-open">View on Luma ↗</span>
                </a>
              </article>
            ))}
          </div>
        </section>

        <footer>
          <p>UX DEN</p>
          <a href="mailto:uxdesignden-bc@gmail.com">uxdesignden-bc@gmail.com</a>
          <a href="https://www.linkedin.com/groups/16579023/" target="_blank" rel="noreferrer">
            LinkedIn group ↗
          </a>
          <nav className="footer-legal" aria-label="Legal">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </nav>
          <span>Vancouver, BC</span>
        </footer>
      </main>
    </div>
  );
}
