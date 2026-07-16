import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ux-design-den.heiko636955.chatgpt.site"),
  title: "UX Design Den",
  description:
    "A low-pressure community for designers and design-adjacent people to learn, practice, and grow.",
  openGraph: {
    title: "UX Design Den",
    description: "Creative workshops and good company for Vancouver designers.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=pally@400,500,700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
