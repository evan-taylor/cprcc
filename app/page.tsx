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
        <MissionSection />
        <WhoWeAreSection />
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
      <div className="absolute inset-0 bg-black/58" />
      <div className="absolute inset-x-0 top-1/2 h-[30rem] -translate-y-1/2 bg-gradient-to-b from-transparent via-black/30 to-transparent" />
      <div className="relative z-10 mx-auto max-w-3xl px-6">
        <div className="animate-fade-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 font-medium text-white/85 text-xs uppercase tracking-[0.2em] backdrop-blur-md">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-[color:var(--color-primary)]"
            />
            Cal Poly San Luis Obispo
          </p>
        </div>
        <h1 className="stagger-1 animate-fade-up font-semibold text-5xl tracking-tight sm:text-6xl lg:text-[4.25rem]">
          <span className="block font-display text-white">Red Cross</span>
          <span className="mt-1 block font-display text-white/80">Club</span>
        </h1>
        <p className="stagger-2 mx-auto mt-6 max-w-[40ch] animate-fade-up text-pretty text-lg text-white/78 sm:text-xl">
          Preventing and relieving suffering through volunteer action
        </p>
        <div className="stagger-3 mt-9 flex animate-fade-up flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-xl bg-[color:var(--color-primary)] px-7 font-semibold text-base text-white shadow-lg shadow-red-900/35 hover:bg-[color:var(--color-primary-hover)] hover:shadow-red-900/40 hover:shadow-xl active:scale-[0.97]"
            href="/events"
          >
            View Upcoming Events
          </Link>
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-xl border border-white/25 bg-white/12 px-7 font-semibold text-base text-white ring-1 ring-white/15 ring-inset backdrop-blur-md hover:bg-white/20 active:scale-[0.97]"
            href="/volunteer-connection"
          >
            Get Involved
          </Link>
        </div>
      </div>
      <div className="absolute bottom-8 flex animate-scroll-hint flex-col items-center gap-1 text-white/50 text-xs">
        <svg
          className="size-5"
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
      <dl className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-6 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            className={`editorial-card-soft interactive-lift flex animate-fade-up flex-col items-center gap-1 rounded-2xl px-6 py-7 text-center ${
              index === 1 ? "stagger-1" : ""
            } ${index === 2 ? "stagger-2" : ""}`}
            key={stat.label}
          >
            <dt className="order-2 text-[color:var(--color-text-muted)] text-sm">
              {stat.label}
            </dt>
            <dd className="font-display font-semibold text-3xl text-red-600 tabular-nums sm:text-4xl">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function MissionSection() {
  return (
    <section className="py-[var(--spacing-section)]" id="mission">
      <div className="mx-auto max-w-5xl px-6">
        <div className="max-w-3xl">
          <p className="editorial-kicker">Our Purpose</p>
          <h2 className="mt-3 max-w-[30ch] font-display font-semibold text-3xl text-[color:var(--color-text-emphasis)] tracking-tight sm:text-4xl">
            Our Mission
          </h2>
          <div className="editorial-lead mt-6 space-y-5">
            {missionCopy.map((paragraph) => (
              <p key={`mission-${paragraph.slice(0, contentKeyPrefixLength)}`}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function WhoWeAreSection() {
  return (
    <section
      className="border-[color:var(--color-border)]/40 border-y bg-[color:var(--color-bg-subtle)]/40 py-[var(--spacing-section)]"
      id="who-we-are"
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="max-w-[30ch] font-display font-semibold text-3xl text-[color:var(--color-text-emphasis)] tracking-tight sm:text-4xl">
          Who We Are
        </h2>
        <div className="editorial-lead space-y-5">
          {whoWeAreCopy.map((paragraph) => (
            <p key={`who-${paragraph.slice(0, contentKeyPrefixLength)}`}>
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
    <section className="relative py-[var(--spacing-section)]">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="mx-auto max-w-[24ch] font-display font-semibold text-3xl text-[color:var(--color-text-emphasis)] tracking-tight sm:text-4xl">
          Ready to make a difference?
        </h2>
        <p className="editorial-lead mx-auto mt-4 max-w-[48ch]">
          Join our community of volunteers and help us serve those in need. All
          Cal Poly students are welcome.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-xl bg-red-600 px-7 font-semibold text-base text-white shadow-md shadow-red-600/20 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 active:scale-[0.97]"
            href="/volunteer-connection"
          >
            Start Volunteering
          </Link>
          <Link
            className="interactive-lift inline-flex h-12 items-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-7 font-semibold text-[color:var(--color-text-emphasis)] text-base shadow-sm hover:border-[color:var(--color-accent-light)] hover:bg-[color:var(--color-accent-soft)] hover:text-[color:var(--color-accent)] active:scale-[0.97]"
            href="/contact"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
}
