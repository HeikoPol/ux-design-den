import type { Metadata } from "next";
import { LegalPage } from "../LegalPage";

export const metadata: Metadata = {
  title: "Privacy | UX Design Den",
  description: "How UX Design Den handles personal information submitted through this website.",
};

const sections = [
  {
    title: "What we collect",
    paragraphs: [
      "When you join the newsletter, we collect the email address you submit and the date it was added. Our hosting and security providers may also process limited technical information, such as an IP address, browser or device details, and request logs, to deliver and protect the site.",
      "We do not intentionally use advertising trackers or build advertising profiles on this site.",
    ],
  },
  {
    title: "Why we use it",
    items: [
      "To send occasional UX Design Den event and community emails.",
      "To operate, secure, and troubleshoot the website.",
      "To respond to privacy, access, correction, or deletion requests.",
    ],
  },
  {
    title: "Consent and unsubscribe",
    paragraphs: [
      "You choose whether to join the newsletter. You can withdraw your consent at any time by using the unsubscribe option or instructions in an email, or by contacting us at uxdesignden-bc@gmail.com. We will stop sending newsletter messages and remove your address from the active list within the time required by law.",
    ],
  },
  {
    title: "Sharing and service providers",
    paragraphs: [
      "We do not sell or rent your personal information. We may give service providers limited access when they support our website hosting, database, security, or newsletter delivery. They may process information outside British Columbia or Canada, where it can be subject to the laws of that location. We may also disclose information when required by law or to protect the site and its users.",
    ],
  },
  {
    title: "Retention and safeguards",
    paragraphs: [
      "We keep your email address while you are subscribed or while it is reasonably needed for the purposes above. After an unsubscribe or deletion request, we remove it from the active list unless we need to keep a limited record to honour the request or meet a legal obligation. Backup copies may remain until they expire through normal system processes.",
      "We use reasonable administrative and technical safeguards appropriate to the limited information we hold, but no online service can guarantee absolute security.",
    ],
  },
  {
    title: "Your choices and rights",
    paragraphs: [
      "You may ask to access or correct your personal information, withdraw consent, or request deletion. To make a request or raise a privacy concern, email uxdesignden-bc@gmail.com. We may need to confirm your identity before completing a request.",
    ],
  },
  {
    title: "Cookies and similar technology",
    paragraphs: [
      "UX Design Den does not intentionally use advertising or analytics cookies. Our hosting providers may use strictly necessary technologies to deliver, secure, and maintain the site.",
    ],
  },
  {
    title: "Changes and contact",
    paragraphs: [
      "We may update this notice as the site or our practices change. The latest version will always appear here with a revised date.",
      "Privacy contact: UX Design Den, Vancouver, British Columbia, Canada — uxdesignden-bc@gmail.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="PRIVACY"
      title="Your inbox. Your information."
      intro="The short version: we collect your email only when you give it to us, use it to keep you close to UX Design Den, and give you a simple way to leave. This notice explains the details."
      sections={sections}
    />
  );
}
