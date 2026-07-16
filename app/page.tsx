import type { Metadata } from "next";
import { HomePage } from "./HomePage";

export const metadata: Metadata = {
  title: "UX Design Den | Vancouver design community",
  description:
    "A low-pressure community for designers and design-adjacent people to learn, practice, and grow.",
};

export default function Home() {
  return <HomePage />;
}
