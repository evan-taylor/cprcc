import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Cal Poly Red Cross Club at Cal Poly SLO. Join our mission to prevent and relieve suffering through disaster relief, blood services, and health & safety training. No experience required!",
  openGraph: {
    title: "Cal Poly Red Cross Club | Volunteer & Make a Difference",
    description:
      "Cal Poly Red Cross Club at Cal Poly SLO. Join our mission to prevent and relieve suffering through disaster relief, blood services, and health & safety training.",
    url: "https://calpolyredcross.org",
    images: [
      {
        url: "/hero.jpg",
        width: 1200,
        height: 630,
        alt: "Cal Poly Red Cross Club volunteers tabling at an event",
      },
    ],
  },
  alternates: {
    canonical: "/",
  },
};

const heroImage = "/hero.jpg";

const missionCopy = [
  `"Our mission is more than words. We always aim to prevent and relieve suffering with every action. The Red Cross shelters, feeds and provides comfort to people affected by disasters; supplies about 40% of the nation\u2019s blood; teaches skills that save lives; distributes international humanitarian aid; and supports veterans, military members and their families.`,
  `The Red Cross is not a government agency. The Red Cross is a registered 501(c)(3) nonprofit organization that depends on volunteers and the generosity of the American public to deliver its mission."`,
];

const whoWeAreCopy = [
  "We are a chapter of the American Red Cross at Cal Poly SLO! No prior experience is necessary to join! Simply show up to our weekly meetings (check the events tab for meeting times and locations) to connect with fellow volunteers and learn about upcoming opportunities.",
  "We offer a variety of ways to get involved, from blood drives and disaster relief efforts to health and safety training!",
];

const contentKeyPrefixLength = 12;

export default async function HomePage() {
  "use cache";
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <SiteHeader variant="inverted" />
      <HeroSection />
      <main>
        <QuickStats />
        <ContentSection
          id="mission"
          paragraphs={missionCopy}
          title="Our Mission"
        />
        <ContentSection
          id="who-we-are"
          paragraphs={whoWeAreCopy}
          title="Who We Are"
        />
        <CTASection />
      </main>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden text-center text-white">
      <Image
        alt="Cal Poly Red Cross Club tabling at an event"
        className="object-cover"
        fill
        priority
        sizes="100vw"
        src={heroImage}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/70" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,rgb(255_255_255_/_0.14),transparent_60%)]" />
      <div className="-top-32 pointer-events-none absolute left-1/2 z-0 h-80 w-80 -translate-x-1/2 rounded-full bg-red-500/20 blur-[90px]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <div className="animate-fade-up">
          <p className="mb-4 font-medium text-sm text-white/70 uppercase tracking-[0.25em]">
            Cal Poly San Luis Obispo
          </p>
        </div>
        <h1 className="stagger-1 animate-fade-up font-bold text-5xl tracking-tight sm:text-6xl lg:text-7xl">
          Red Cross Club
        </h1>
        <div className="stagger-2 mx-auto mt-4 h-0.5 w-20 animate-fade-up rounded-full bg-white/40" />
        <p className="stagger-3 mx-auto mt-6 max-w-xl animate-fade-up text-lg text-white/80 leading-relaxed sm:text-xl">
          Preventing and relieving suffering through volunteer action
        </p>
        <div className="stagger-4 mt-8 flex animate-fade-up flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-full bg-red-600 px-8 font-semibold text-base text-white shadow-lg shadow-red-600/30 hover:bg-red-700 hover:shadow-red-600/40 hover:shadow-xl active:scale-[0.97]"
            href="/events"
          >
            View Upcoming Events
          </Link>
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-full bg-white/15 px-8 font-semibold text-base text-white ring-1 ring-white/25 ring-inset backdrop-blur-sm hover:bg-white/25 active:scale-[0.97]"
            href="/volunteer-connection"
          >
            Get Involved
          </Link>
        </div>
      </div>
      <div className="absolute bottom-8 flex animate-scroll-hint flex-col items-center gap-1 text-white/50 text-xs">
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <title>Scroll down</title>
          <path
            d="M19 14l-7 7m0 0l-7-7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}

function QuickStats() {
  const stats = [
    { value: "40%", label: "of the nation\u2019s blood supply" },
    { value: "300+", label: "chapters nationwide" },
    { value: "Free", label: "to join \u2014 no experience needed" },
  ];

  return (
    <section className="border-[color:var(--color-border)]/60 border-b bg-[color:var(--color-bg-subtle)]/40 py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <article
            className={`editorial-card-soft interactive-lift flex flex-col items-center gap-1 rounded-2xl px-6 py-7 text-center animate-fade-up ${
              index === 1 ? "stagger-1" : ""
            } ${index === 2 ? "stagger-2" : ""}`}
            key={stat.label}
          >
            <span
              className="font-display font-semibold text-3xl text-red-600 sm:text-4xl"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {stat.value}
            </span>
            <span className="text-[color:var(--color-text-muted)] text-sm">
              {stat.label}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContentSection({
  id,
  title,
  paragraphs,
}: {
  id: string;
  title: string;
  paragraphs: string[];
}) {
  return (
    <section className="py-[var(--spacing-section)]" id={id}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <h2 className="font-display font-semibold text-3xl text-[color:var(--color-text-emphasis)] sm:text-4xl">
            {title}
          </h2>
          <div className="h-0.5 w-12 rounded-full bg-red-600/30" />
        </div>
        <div className="editorial-lead space-y-5">
          {paragraphs.map((paragraph) => (
            <p key={`${id}-${paragraph.slice(0, contentKeyPrefixLength)}`}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="border-[color:var(--color-border)]/60 border-t bg-[color:var(--color-bg-subtle)]/70 py-[var(--spacing-section)]">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-display font-semibold text-3xl text-[color:var(--color-text-emphasis)] sm:text-4xl">
          Ready to make a difference?
        </h2>
        <p className="editorial-lead mx-auto mt-4 max-w-xl">
          Join our community of volunteers and help us serve those in need. All
          Cal Poly students are welcome.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-full bg-red-600 px-8 font-semibold text-base text-white shadow-md shadow-red-600/20 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 active:scale-[0.97]"
            href="/volunteer-connection"
          >
            Start Volunteering
          </Link>
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-full border border-slate-200 bg-white px-8 font-semibold text-base text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-[0.97]"
            href="/contact"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
