import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Deployment & Training",
  description:
    "Learn about Red Cross deployment opportunities and GAP training for Cal Poly students. Join disaster relief efforts nationwide through Disaster Cycle Services. Complete GAP training to deploy.",
  openGraph: {
    title: "Deployment & Training | Cal Poly Red Cross Club",
    description:
      "Learn about Red Cross deployment opportunities and GAP training for Cal Poly students. Join disaster relief efforts nationwide through Disaster Cycle Services.",
    url: "https://calpolyredcross.org/deployment",
  },
  alternates: {
    canonical: "/deployment",
  },
};

const overview = [
  "To join Disaster Cycle Services you will complete online GAP (Group, Activity, Position) training. Sheltering and Feeding GAPs are the best starting point because they teach how Red Cross shelters operate and how every team collaborates.",
  "Most first-time responders begin as Service Associates (SAs) who support daily operations. If you hold credentials like EMT, CNA, MA, or Phlebotomy, you can build toward Disaster Action Team or Disaster Health Services roles after your core GAPs are finished.",
];

const deploymentNotes = [
  "“Deployment” means traveling outside your immediate area for about two weeks after local rosters are full. Assignments reflect your GAP—shelter operations, feeding, logistics, client care, or health services.",
  "Travel, housing, and food are provided by the Red Cross during large-scale responses such as hurricanes or wildfires. Boost your chances of being selected by completing multiple GAP trainings and serving locally first.",
];

const steps = [
  {
    title: "Become an official Red Cross member",
    body: "Follow the national onboarding instructions to set up your volunteer profile and sign all agreements.",
    link: {
      href: "/volunteer-connection",
      label: "View membership steps",
    },
  },
  {
    title: "Choose your GAP",
    body: "Review the GAP chart (Figure 1) and pick the Group, Activity, and Position that fits your interests or credentials.",
  },
  {
    title: "Email your regional recruiter",
    body: "Send micaela.duarte@redcross.org your intended GAP and copy christin.newlon@redcross.org so the Cal Poly coordinator is updated.",
  },
  {
    title: "Complete the interview and EDGE courses",
    body: "A phone interview confirms your goals. The recruiter then loads required training into Volunteer Connection and EDGE.",
  },
  {
    title: "Accept deployment requests",
    body: "After your GAP is recorded you will receive deployment notifications. Say yes when the timing and assignment work for you.",
  },
];

const gapLegend = [
  {
    title: "Groups (G)",
    description:
      "Listed in blue across the top of the chart. Each group covers a response pillar such as Sheltering, Feeding, Logistics, or Health Services.",
  },
  {
    title: "Activities (A)",
    description:
      "Printed in black beneath each group. They describe the functional lane (e.g., mass care feeding or client casework).",
  },
  {
    title: "Positions (P)",
    description:
      "Shown in red under each activity. Service Associate (SA) is the starting role for most volunteers before promoting.",
  },
];

const reminderItems = [
  "Access EDGE through Volunteer Connection so coursework logs to your profile automatically.",
  "Manually log contacts, interviews, club events, and deployments in Volunteer Connection to keep your experience current.",
  "Update the &quot;My Profile&quot; tab with accurate contact info, skills, and availability before deployment season.",
  "Club-specific questions: redcrossclub@calpoly.edu. ARC program questions: christin.newlon@redcross.org.",
];

export default function DeploymentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <HeroCard />
        <DeploymentSnapshot />
        <StepsSection />
        <GapSection />
        <RemindersSection />
      </main>
    </div>
  );
}

function HeroCard() {
  return (
    <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="space-y-4">
        <p className="font-display font-semibold text-red-600 text-sm uppercase tracking-wider">
          Deployments
        </p>
        <h1 className="font-bold font-display text-4xl text-slate-900 tracking-tight sm:text-5xl">
          Take your service nationwide
        </h1>
        {overview.map((paragraph) => (
          <p className="text-lg text-slate-700 leading-relaxed" key={paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-slate-500 text-sm uppercase tracking-wide">
            Start with shelter + feeding
          </p>
          <p className="mt-2 text-slate-900 text-sm leading-relaxed">
            These GAPs explain shelter layouts, meal distribution, and daily
            rhythms. After you master them, it is easier to cross-train into
            logistics, health services, or client care.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-slate-500 text-sm uppercase tracking-wide">
            Have credentials already?
          </p>
          <p className="mt-2 text-slate-900 text-sm leading-relaxed">
            Let recruiters know about EMT, CNA, MA, or Phlebotomy licenses so
            they can queue Disaster Action Team or Disaster Health Services
            training after your core GAPs.
          </p>
        </article>
      </div>
    </section>
  );
}

function DeploymentSnapshot() {
  return (
    <section className="rounded-2xl border border-white/80 bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-6 md:grid-cols-2">
        <article>
          <h2 className="font-display font-semibold text-2xl text-slate-900">
            What &quot;deployment&quot; means
          </h2>
          <p className="mt-3 text-base text-slate-700 leading-relaxed">
            Deployments are two-week assignments in another county, region, or
            state once local needs outpace local responders. You will keep
            working within the GAP you trained for, whether that is sheltering,
            feeding, logistics, or client care.
          </p>
        </article>
        <ul className="space-y-4 text-slate-700 text-sm">
          {deploymentNotes.map((note) => (
            <li
              className="rounded-2xl border border-slate-100 bg-slate-50 p-4 leading-relaxed"
              key={note}
            >
              {note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="rounded-2xl border border-white/80 bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <header className="mb-6 space-y-1">
        <h2 className="font-display font-semibold text-2xl text-slate-900">
          General steps to deploy
        </h2>
        <p className="text-slate-600 text-sm">
          Follow this path to move from club member to deployable volunteer.
        </p>
      </header>
      <ol className="relative space-y-6">
        <div className="pointer-events-none absolute top-0 left-5 hidden h-full w-px bg-gradient-to-b from-red-200 via-red-300 to-transparent md:block" />
        {steps.map((step, index) => (
          <li className="relative flex gap-4 md:gap-6" key={step.title}>
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 font-semibold text-white shadow-md">
              {index + 1}
            </div>
            <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <h3 className="font-semibold text-base text-slate-900">
                {step.title}
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                {step.body}
              </p>
              {step.link ? (
                <Link
                  className="inline-flex font-semibold text-red-600 text-sm underline-offset-4 transition-colors hover:underline"
                  href={step.link.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {step.link.label} →
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function GapSection() {
  return (
    <section className="rounded-2xl border border-white/80 bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <header className="space-y-2">
        <p className="font-semibold text-slate-500 text-xs uppercase tracking-wider">
          Figure 1
        </p>
        <h2 className="font-display font-semibold text-2xl text-slate-900">
          Understanding the GAP chart
        </h2>
        <p className="text-slate-700 text-sm">
          Align your interests with the right Group, Activity, and Position
          before you request training.
        </p>
      </header>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Image
          alt="American Red Cross Group/Activity/Position (GAP) Chart showing Disaster Cycle Services organizational structure"
          className="h-auto w-full"
          height={1545}
          src="/gap-chart.jpg"
          width={2000}
        />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {gapLegend.map((item) => (
          <article
            className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
            key={item.title}
          >
            <h3 className="font-semibold text-base text-slate-900">
              {item.title}
            </h3>
            <p className="mt-2 text-slate-700 text-sm">{item.description}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-slate-700 text-sm leading-relaxed">
        Light blue = client-facing, yellow = first-time volunteer priorities,
        green = best for volunteers with health licenses.
      </p>
    </section>
  );
}

function RemindersSection() {
  return (
    <section className="rounded-2xl border border-white/80 bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-display font-semibold text-2xl text-slate-900">
        General reminders
      </h2>
      <ul className="mt-4 space-y-3 text-slate-700 text-sm">
        {reminderItems.map((item) => (
          <li
            className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
            key={item}
          >
            <span className="mt-1 h-2 w-2 rounded-full bg-red-500" />
            <p className="leading-relaxed">{item}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
