import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Join Adspend & OperatorHQ",
  description: "We are building the future of decentralized advertising and AI operating systems. View open roles and apply today.",
  openGraph: {
    type: "website",
    title: "Join Adspend & OperatorHQ",
    description: "We are building the future of decentralized advertising and AI operating systems.",
    url: "https://join.adspend.agency/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Join Adspend & OperatorHQ",
    description: "We are building the future of decentralized advertising and AI operating systems.",
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
