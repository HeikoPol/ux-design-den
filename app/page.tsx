import { HomePage } from "./HomePage";
import { HOME_DESCRIPTION, HOME_TITLE, pageMetadata } from "../lib/seo";

export const metadata = pageMetadata({
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return <HomePage />;
}
