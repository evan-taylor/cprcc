import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newsletter preferences",
  description:
    "Manage Cal Poly Red Cross Club newsletter email subscription and preferences.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function NewsletterSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
