import Link from "next/link";
import SiteHeader from "@/components/site-header";

const sitePages = [
  {
    title: "Home",
    href: "/",
    description:
      "Learn about our mission and who we are as the Cal Poly Red Cross Club",
  },
  {
    title: "Events",
    href: "/events",
    description:
      "Browse upcoming volunteer opportunities and RSVP to Red Cross activities",
  },
  {
    title: "Gallery",
    href: "/gallery",
    description:
      "Browse photos from our events and see our volunteers in action",
  },
  {
    title: "Volunteer Connection",
    href: "/volunteer-connection",
    description:
      "Step-by-step guide to becoming an official American Red Cross volunteer",
  },
  {
    title: "Deployment",
    href: "/deployment",
    description:
      "Learn about GAP training and nationwide deployment opportunities",
  },
  {
    title: "Contact",
    href: "/contact",
    description: "Get in touch with us via email, GroupMe, or Instagram",
  },
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 pt-28 pb-24 sm:px-8">
        <header className="max-w-xl">
          <p className="editorial-kicker animate-fade-up">Sitemap</p>
          <h1 className="stagger-1 editorial-title mt-3 animate-fade-up">
            Explore our website
          </h1>
          <p className="stagger-2 editorial-lead mt-4 animate-fade-up">
            Find all the pages and resources available on the Cal Poly Red Cross
            Club website.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {sitePages.map((page) => (
            <Link
              className="group editorial-card flex flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
              href={page.href}
              key={page.href}
            >
              <h3 className="font-semibold text-[color:var(--color-text-emphasis)] text-lg transition-colors duration-150 group-hover:text-red-600">
                {page.title}
              </h3>
              <p className="mt-2 text-[color:var(--color-text-muted)] text-sm">
                {page.description}
              </p>
              <span className="mt-4 font-medium text-red-600 text-sm transition-colors duration-150 group-hover:text-red-700">
                Visit page
                <span className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
