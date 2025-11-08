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
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pt-32 pb-20 sm:px-8 lg:px-12">
        <HeroCard />
        <PagesSection />
      </main>
    </div>
  );
}

function HeroCard() {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <div className="space-y-4">
        <p className="text-rose-700 text-sm uppercase tracking-[0.3em]">
          Sitemap
        </p>
        <h1 className="font-semibold text-4xl text-slate-900">
          Explore our website
        </h1>
        <p className="text-lg text-slate-700">
          Find all the pages and resources available on the Cal Poly Red Cross
          Club website. Navigate to any section to learn more about our mission,
          events, and volunteer opportunities.
        </p>
      </div>
    </section>
  );
}

function PagesSection() {
  return (
    <section className="rounded-3xl border border-white/80 bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="mb-6 font-semibold text-2xl text-slate-900">All Pages</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {sitePages.map((page) => (
          <Link
            className="flex flex-col rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-rose-300 hover:shadow-sm"
            href={page.href}
            key={page.href}
          >
            <h3 className="font-semibold text-lg text-slate-900">
              {page.title}
            </h3>
            <p className="mt-2 text-slate-600 text-sm">{page.description}</p>
            <span className="mt-3 font-medium text-rose-700 text-sm">
              Visit page →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
