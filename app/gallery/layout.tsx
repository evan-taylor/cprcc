import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description:
    "Browse photos from Cal Poly Red Cross Club events and activities. See our volunteers in action at blood drives, community service events, and disaster relief training.",
  openGraph: {
    title: "Photo Gallery | Cal Poly Red Cross Club",
    description:
      "Browse photos from Cal Poly Red Cross Club events and activities. See our volunteers in action at blood drives, community service events, and disaster relief training.",
    url: "https://calpolyredcross.org/gallery",
  },
  alternates: {
    canonical: "/gallery",
  },
};

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
