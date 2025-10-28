import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/convex-client-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Cal Poly Red Cross Club | Volunteer & Make a Difference",
    template: "%s | Cal Poly Red Cross Club",
  },
  description:
    "Join the Cal Poly Red Cross Club at Cal Poly SLO. Volunteer with disaster relief, blood drives, health & safety training. No experience needed. Get involved today!",
  keywords: [
    "Cal Poly Red Cross",
    "Cal Poly SLO volunteer",
    "Red Cross club",
    "disaster relief volunteer",
    "blood drive volunteer",
    "Cal Poly volunteering",
    "American Red Cross",
    "student volunteer opportunities",
    "San Luis Obispo volunteer",
    "Red Cross training",
  ],
  authors: [{ name: "Cal Poly Red Cross Club" }],
  creator: "Cal Poly Red Cross Club",
  publisher: "Cal Poly Red Cross Club",
  metadataBase: new URL("https://calpolyredcross.org"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://calpolyredcross.org",
    siteName: "Cal Poly Red Cross Club",
    title: "Cal Poly Red Cross Club | Volunteer & Make a Difference",
    description:
      "Join the Cal Poly Red Cross Club at Cal Poly SLO. Volunteer with disaster relief, blood drives, health & safety training. No experience needed. Get involved today!",
    images: [
      {
        url: "/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Cal Poly Red Cross Club volunteers at an event",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cal Poly Red Cross Club | Volunteer & Make a Difference",
    description:
      "Join the Cal Poly Red Cross Club at Cal Poly SLO. Volunteer with disaster relief, blood drives, health & safety training. No experience needed.",
    images: ["/hero.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/redcross.svg",
    apple: "/redcross.svg",
  },
  verification: {
    google: "google-site-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Cal Poly Red Cross Club",
    alternateName: "Cal Poly SLO Red Cross Club",
    url: "https://calpolyredcross.org",
    logo: "https://calpolyredcross.org/redcross.svg",
    description:
      "Student chapter of the American Red Cross at California Polytechnic State University, San Luis Obispo. We provide volunteer opportunities in disaster relief, blood services, and health & safety training.",
    email: "redcrossclub@calpoly.edu",
    sameAs: [
      "https://www.instagram.com/calpolyredcrossclub",
      "https://groupme.com/join_group/110362987/vWy9gKFG",
    ],
    parentOrganization: {
      "@type": "Organization",
      name: "American Red Cross",
      url: "https://www.redcross.org",
    },
    location: {
      "@type": "Place",
      name: "California Polytechnic State University",
      address: {
        "@type": "PostalAddress",
        addressLocality: "San Luis Obispo",
        addressRegion: "CA",
        addressCountry: "US",
      },
    },
    memberOf: {
      "@type": "Organization",
      name: "American Red Cross",
    },
  };

  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <head>
          <script
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationSchema),
            }}
            type="application/ld+json"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
