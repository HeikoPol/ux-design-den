/**
 * The upcoming session. Read by the home page card and by the Event JSON-LD in
 * lib/seo.ts, so the two can't disagree.
 *
 * Set to null when nothing is scheduled: the card falls back to its "to be
 * announced" state and the Event markup is omitted — Google penalises Event
 * schema that doesn't describe a real dated event. After the date passes,
 * move the entry into pastEvents in HomePage.tsx and set this back to null.
 */
/** A responsive image set: /events/<name>-<w>.avif|webp at each listed width. */
export type EventArt = { name: string; widths: number[]; width: number; height: number };

export function artSrcSet(art: EventArt, ext: "avif" | "webp"): string {
  return art.widths.map((w) => `/events/${art.name}-${w}.${ext} ${w}w`).join(", ");
}

export type NextEvent = {
  title: string;
  /** ISO 8601 with offset — what schema.org wants, and unambiguous across DST. */
  start: string;
  end: string;
  /** Human labels, kept next to the ISO values so nobody has to derive them. */
  dateLabel: string;
  timeLabel: string;
  venue: string;
  address: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  /** One or two sentences for the card. */
  blurb: string;
  /** Fuller text for the structured data. */
  description: string;
  href: string;
  /** Site-relative path to a self-hosted image for the Event markup. */
  image: string;
  /** Responsive set for the card. Optional: without it the card shows the shader. */
  art?: EventArt;
  free: boolean;
};

export const nextEvent: NextEvent | null = {
  title: "I'm a Designer, Ask Me Anything",
  start: "2026-10-28T17:30:00-07:00",
  end: "2026-10-28T18:30:00-07:00",
  dateLabel: "Wed, Oct 28",
  timeLabel: "5:30 \u2013 6:30 PM",
  venue: "Northeastern University Vancouver",
  address: {
    streetAddress: "410 W Georgia St #1400",
    addressLocality: "Vancouver",
    addressRegion: "BC",
    postalCode: "V6B 1Z3",
    addressCountry: "CA",
  },
  blurb:
    "An open Q&A with design leaders who have worked across agencies, startups, freelancing and corporate teams. Bring a question.",
  description:
    "An open Q&A panel for Vancouver designers. Design work looks different depending on where you do it: an agency runs on billable hours and client politics, a startup trades certainty for influence, freelancing makes you your own account manager, and a corporate team means process and scale. Design leaders who have worked across those settings take questions from the floor, including what they look for when hiring juniors. Hosted with the Information Design & Data Visualization program at Northeastern University Vancouver.",
  href: "https://luma.com/k73ibpyx",
  image: "/events/ask-me-anything.jpg",
  art: { name: "ask-me-anything", widths: [600, 900, 1080], width: 1080, height: 1080 },
  free: true,
};

/**
 * A known date for the next session before its details are settled. Shown on
 * the placeholder card; deliberately not enough for Event markup, which needs
 * a name and a venue. Set to null when even the date is unknown.
 */
export const nextEventHint: string | null = null;
