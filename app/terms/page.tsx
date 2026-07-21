import type { Metadata } from "next";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = {
  title: "Terms | UX Design Den",
  description: "The terms that apply when using the UX Design Den website.",
};

const sections = [
  {
    title: "Using this site",
    paragraphs: [
      "By using this website, you agree to these terms. If you do not agree, please do not use the site. You must use the site lawfully and must not interfere with its operation, attempt unauthorized access, or use it to harm another person.",
    ],
  },
  {
    title: "Events and information",
    paragraphs: [
      "Event descriptions, dates, venues, availability, and prices are provided for general information and can change. An event may be rescheduled or cancelled. Registration and attendance are handled through the event page on Luma and may be subject to additional organizer, venue, or platform terms.",
    ],
  },
  {
    title: "Newsletter",
    paragraphs: [
      "If you subscribe, please provide an email address you are authorized to use. Newsletter timing is not guaranteed. You can unsubscribe at any time using the option or instructions in an email, or by contacting uxdesignden-bc@gmail.com.",
    ],
  },
  {
    title: "External services",
    paragraphs: [
      "This site links to services we do not control, including Luma and LinkedIn. Their own terms and privacy practices apply when you visit them. A link does not mean that UX Design Den is responsible for their content, availability, or services.",
    ],
  },
  {
    title: "Content and intellectual property",
    paragraphs: [
      "The UX Design Den name, site design, written content, graphics, and other materials are owned by UX Design Den or used with permission. You may view and share links to the site for personal, non-commercial use. Please ask before copying, republishing, or commercially using site materials. Event images and third-party materials remain the property of their respective owners.",
    ],
  },
  {
    title: "No professional advice",
    paragraphs: [
      "Website and event content is educational and community-focused. It is not legal, financial, medical, employment, or other professional advice, and it should not be relied on as a substitute for advice suited to your situation.",
    ],
  },
  {
    title: "Availability and responsibility",
    paragraphs: [
      "The site and its content are provided on an “as available” basis. We try to keep information accurate and the site working, but do not promise that either will always be complete, current, uninterrupted, or error-free. To the extent permitted by law, UX Design Den is not responsible for indirect or consequential loss resulting from use of the site, external services, or event information. Nothing in these terms excludes rights or responsibilities that cannot legally be excluded.",
    ],
  },
  {
    title: "Law, changes, and contact",
    paragraphs: [
      "These terms are governed by the laws of British Columbia and the applicable laws of Canada. We may update them as the site changes. The version posted here applies from its last-updated date.",
      "Questions: UX Design Den, Vancouver, British Columbia, Canada — uxdesignden-bc@gmail.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="TERMS"
      title="Keep it kind. Keep it useful."
      intro="These are the ground rules for using the UX Design Den website. They are intentionally short and written in plain language."
      sections={sections}
    />
  );
}
