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

export const nextEvent: NextEvent | null = null;

/**
 * A known date for the next session before its details are settled. Shown on
 * the placeholder card; deliberately not enough for Event markup, which needs
 * a name and a venue. Set to null when even the date is unknown.
 */
export const nextEventHint: string | null = "Wed, Oct 28";
