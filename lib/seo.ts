import type { Metadata } from "next";

/**
 * Shared SEO pieces. Each page builds its metadata through pageMetadata() so
 * canonical, og:url and the social card stay consistent — Next replaces a
 * page's openGraph block wholesale rather than merging it with the layout's,
 * so defining it in one place is the only way to keep the fields aligned.
 *
 * Naming note: "Vancouver Design Community" is a separate group we're on good
 * terms with. Describe UX Den by what it does — low-pressure design meetups in
 * Vancouver — and don't reuse their name as a descriptor.
 */

export const SITE_NAME = "UX Den";

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? "https://uxden.ca";

export const HOME_TITLE = "UX Den | Low-pressure design meetups in Vancouver";

export const HOME_DESCRIPTION =
  "A low-pressure place in Vancouver for designers and design-adjacent people to learn, practice, and grow.";

const OG_IMAGE = {
  url: "/og.jpg",
  width: 1200,
  height: 630,
  alt: "UX Den — low-pressure design meetups in Vancouver",
};

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  /** Site-relative, e.g. "/" or "/privacy". Resolved against metadataBase. */
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_CA",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

/**
 * Organization markup, emitted once from the root layout. Event markup is
 * deliberately absent: the "next session" on the home page is a placeholder,
 * and Google penalises Event schema that doesn't describe a real dated event.
 * When one is scheduled, add an Event object here with startDate, location and
 * the Luma URL as the offers/url, and it'll be eligible for event rich results.
 */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/apple-touch-icon.png`,
  description: HOME_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Vancouver",
    addressRegion: "BC",
    addressCountry: "CA",
  },
  sameAs: ["https://www.linkedin.com/groups/16579023/"],
};
