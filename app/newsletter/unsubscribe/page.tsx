import type { Metadata } from "next";
import NewsletterUnsubscribeClientPage from "./unsubscribe-client-page";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description:
    "Manage whether you receive Cal Poly Red Cross Club newsletter emails.",
  alternates: {
    canonical: "/newsletter/unsubscribe",
  },
};

export default function NewsletterUnsubscribePage() {
  return <NewsletterUnsubscribeClientPage />;
}
