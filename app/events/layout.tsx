import type { Metadata } from "next";

/**
 * Static SEO for `/events`. Client pages under `/events/[eventId]` inherit this
 * until a server `generateMetadata` is added with a Convex prefetch for title/slug.
 */
export const metadata: Metadata = {
  title: "Events & RSVP",
  description:
    "Browse upcoming Cal Poly Red Cross Club volunteer opportunities and events. RSVP to blood drives, disaster relief training, and community service events at Cal Poly SLO.",
  openGraph: {
    title: "Events & RSVP | Cal Poly Red Cross Club",
    description:
      "Browse upcoming Cal Poly Red Cross Club volunteer opportunities and events. RSVP to blood drives, disaster relief training, and community service events at Cal Poly SLO.",
    url: "https://calpolyredcross.org/events",
  },
  alternates: {
    canonical: "/events",
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
