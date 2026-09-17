/**
 * The upcoming session. Read by the home page card and by the Event JSON-LD in
 * lib/seo.ts, so the two can't disagree.
 *
 * Set to null when nothing is scheduled: the card falls back to its "to be
 * announced" state and the Event markup is omitted — Google penalises Event
 * schema that doesn't describe a real dated event. After the date passes,
 * move the entry into pastEvents in HomePage.tsx and set this back to null.
 */
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
  free: boolean;
};

export const nextEvent: NextEvent | null = {
  title: "Coffee, Collab, and ‘Countability",
  start: "2026-09-28T09:00:00-07:00",
  end: "2026-09-28T13:00:00-07:00",
  dateLabel: "Mon, Sep 28",
  timeLabel: "9 AM – 1 PM",
  venue: "Main & 14th Plaza",
  address: {
    streetAddress: "Main St & E 14th Ave",
    addressLocality: "Vancouver",
    addressRegion: "BC",
    postalCode: "V5T 3G3",
    addressCountry: "CA",
  },
  blurb:
    "Start the week with a morning co-work session. Outdoors at the plaza if the weather holds, a nearby café if it doesn’t. Bring whatever you’re working on.",
  description:
    "A Monday morning co-working session for Vancouver designers. Working from home is tempting, but a designated space with others brings accountability, productivity and a sense of community. Weather permitting we’ll be outdoors at the Main & 14th plaza — tables, patio umbrellas and outlets for laptops — with JJ Bean or Forecast as the rainy-day backup. Bring whatever you’re currently working on.",
  href: "https://luma.com/4hkttl1f",
  image: "/events/coffee-collab-countability.jpg",
  free: true,
};
