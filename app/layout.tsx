import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Careers — Adspend Agency & OperatorHQ AI | Join the Future of Ads & AI",
  description: "Join Adspend and OperatorHQ AI — media buyers, creatives, engineers, and operators building the future of performance marketing and private AI systems. View open roles and apply today.",
  openGraph: {
    type: "website",
    title: "Careers — Adspend Agency & OperatorHQ AI",
    description: "Join the team building the future of ads and AI. Media buyers, creatives, engineers, and operators wanted.",
    url: "https://join.adspend.agency/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers — Adspend Agency & OperatorHQ AI",
    description: "Join the team building the future of ads and AI. Media buyers, creatives, engineers, and operators wanted.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
