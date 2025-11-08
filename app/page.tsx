import type { Metadata } from "next";
import Image from "next/image";
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
  `"Our mission is more than words. We always aim to prevent and relieve suffering with every action. The Red Cross shelters, feeds and provides comfort to people affected by disasters; supplies about 40% of the nation’s blood; teaches skills that save lives; distributes international humanitarian aid; and supports veterans, military members and their families.`,
  `The Red Cross is not a government agency. The Red Cross is a registered 501(c)(3) nonprofit organization that depends on volunteers and the generosity of the American public to deliver its mission."`,
];

const whoWeAreCopy = [
  "We are a chapter of the American Red Cross at Cal Poly SLO! No prior experience is necessary to join! Simply show up to our weekly meetings (check the events tab for meeting times and locations) to connect with fellow volunteers and learn about upcoming opportunities.",
  "We offer a variety of ways to get involved, from blood drives and disaster relief efforts to health and safety training!",
];

const contentKeyPrefixLength = 12;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeader variant="inverted" />
      <HeroSection />
      <main className="space-y-16 pt-16 pb-24">
        <ContentSection id="mission" paragraphs={missionCopy} title="Mission" />
        <ContentSection
          id="who-we-are"
          paragraphs={whoWeAreCopy}
          title="Who we are"
        />
      </main>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden text-center text-white">
      <Image
        alt="Cal Poly Red Cross Club tabling at an event"
        className="object-cover"
        fill
        priority
        src={heroImage}
      />
      <div className="absolute inset-0 bg-black/55" />
      <div className="relative z-10 px-4">
        <h1 className="mt-6 font-semibold text-4xl sm:text-5xl">
          Cal Poly SLO Red Cross Club
        </h1>
        <div className="mx-auto mt-3 h-1 w-28 rounded-full bg-white" />
      </div>
      <div className="absolute bottom-10 flex flex-col items-center gap-1 text-white/80 text-xs uppercase tracking-wide">
        <span>Scroll</span>
        <span className="text-2xl">⌄</span>
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
    <section className="px-4" id={id}>
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
        <h2 className="font-semibold text-3xl text-red-600">{title}</h2>
        <div className="h-0.5 w-16 bg-slate-200" />
        <div className="space-y-4 text-lg text-slate-900 leading-relaxed">
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
