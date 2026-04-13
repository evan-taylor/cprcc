import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteFooter from "@/components/site-footer";
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

const heroImage = "/hero-home-bg.jpg";

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
      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden text-center text-white [clip-path:polygon(0_0,100%_0,100%_calc(100%-2.5rem),0_100%)] sm:[clip-path:polygon(0_0,100%_0,100%_calc(100%-3.5rem),0_100%)]">
      <Image
        alt="Cal Poly Red Cross Club tabling at an event"
        className="object-cover"
        fill
        priority
        sizes="100vw"
        src={heroImage}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628]/88 via-black/60 to-[#1a0a0a]/85" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,rgb(255_255_255_/_0.12),transparent_55%)]" />
      <div className="pointer-events-none absolute -top-28 left-1/2 z-0 h-[22rem] w-[22rem] -translate-x-1/2 rounded-full bg-[color:var(--color-primary)]/25 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 z-0 h-72 w-72 rounded-full bg-[color:var(--color-accent)]/20 blur-[90px]" />
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <div className="animate-fade-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 font-medium text-white/85 text-xs uppercase tracking-[0.2em] backdrop-blur-md">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-primary)] shadow-[0_0_14px_rgb(226_18_36_/_0.55)]"
            />
            Cal Poly San Luis Obispo
          </p>
        </div>
        <h1 className="stagger-1 animate-fade-up font-bold text-5xl tracking-[-0.04em] sm:text-6xl lg:text-[4.25rem] lg:leading-[1.05]">
          <span className="block font-display text-white/95">Red Cross</span>
          <span className="mt-1 block bg-gradient-to-r from-white via-white to-white/75 bg-clip-text font-display text-transparent">
            Club
          </span>
        </h1>
        <div className="stagger-2 mx-auto mt-5 flex animate-fade-up justify-center gap-2">
          <span className="h-1 w-10 rounded-full bg-[color:var(--color-primary)]" />
          <span className="h-1 w-3 rounded-full bg-white/35" />
        </div>
        <p className="stagger-3 mx-auto mt-6 max-w-xl animate-fade-up text-lg text-white/78 leading-relaxed sm:text-xl">
          Preventing and relieving suffering through volunteer action
        </p>
        <div className="stagger-4 mt-9 flex animate-fade-up flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-xl bg-[color:var(--color-primary)] px-8 font-semibold text-base text-white shadow-lg shadow-red-900/35 hover:bg-[color:var(--color-primary-hover)] hover:shadow-red-900/40 hover:shadow-xl active:scale-[0.97]"
            href="/events"
          >
            View Upcoming Events
          </Link>
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-xl border border-white/25 bg-white/12 px-8 font-semibold text-base text-white ring-1 ring-white/15 ring-inset backdrop-blur-md hover:bg-white/20 active:scale-[0.97]"
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
    <section className="relative border-[color:var(--color-border)]/50 border-b bg-[color:var(--color-bg-subtle)]/50 py-12">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <article
            className={`editorial-card-soft interactive-lift flex animate-fade-up flex-col items-center gap-1 rounded-2xl px-6 py-7 text-center ${
              index === 1 ? "stagger-1" : ""
            } ${index === 2 ? "stagger-2" : ""}`}
            key={stat.label}
          >
            <span
              className="font-bold font-display text-3xl text-red-600 sm:text-4xl"
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
          <h2 className="font-bold font-display text-3xl text-[color:var(--color-text-emphasis)] sm:text-4xl">
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
    <section className="relative border-[color:var(--color-border)]/50 border-t bg-gradient-to-b from-[color:var(--color-bg-subtle)]/80 to-[color:var(--color-bg)] py-[var(--spacing-section)]">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-bold font-display text-3xl text-[color:var(--color-text-emphasis)] sm:text-4xl">
          Ready to make a difference?
        </h2>
        <p className="editorial-lead mx-auto mt-4 max-w-xl">
          Join our community of volunteers and help us serve those in need. All
          Cal Poly students are welcome.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-lg bg-red-600 px-8 font-semibold text-base text-white shadow-md shadow-red-600/20 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 active:scale-[0.97]"
            href="/volunteer-connection"
          >
            Start Volunteering
          </Link>
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-8 font-semibold text-[color:var(--color-text-emphasis)] text-base shadow-sm hover:border-[color:var(--color-accent-light)] hover:bg-[color:var(--color-accent-soft)] hover:text-[color:var(--color-accent)] active:scale-[0.97]"
            href="/contact"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
