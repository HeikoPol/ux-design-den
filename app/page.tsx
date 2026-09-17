import { HomePage } from "./HomePage";
import { HOME_DESCRIPTION, HOME_TITLE, eventSchema, pageMetadata } from "../lib/seo";

export const metadata = pageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return (
    <>
      {eventSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventSchema) }}
        />
      )}
      <HomePage />
    </>
  );
}
