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
  "\u201CDeployment\u201D means traveling outside your immediate area for about two weeks after local rosters are full. Assignments reflect your GAP\u2014shelter operations, feeding, logistics, client care, or health services.",
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
  "Update the \u201CMy Profile\u201D tab with accurate contact info, skills, and availability before deployment season.",
  "Club-specific questions: redcrossclub@calpoly.edu. ARC program questions: christin.newlon@redcross.org.",
];

export default async function DeploymentPage() {
  "use cache";
  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        <header className="max-w-2xl">
          <p className="editorial-kicker animate-fade-up">Deployments</p>
          <h1 className="stagger-1 editorial-title mt-3 animate-fade-up">
            Take your service nationwide
          </h1>
          <div className="stagger-2 mt-5 animate-fade-up space-y-4">
            {overview.map((paragraph) => (
              <p className="editorial-lead" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="editorial-card-soft rounded-2xl p-6">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <title>Shelter icon</title>
                <path
                  d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-[color:var(--color-text-emphasis)] text-sm">
              Start with shelter + feeding
            </h3>
            <p className="mt-1.5 text-[color:var(--color-text-muted)] text-sm leading-relaxed">
              These GAPs explain shelter layouts, meal distribution, and daily
              rhythms. After you master them, it is easier to cross-train into
              logistics, health services, or client care.
            </p>
          </article>
          <article className="editorial-card-soft rounded-2xl p-6">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <title>Credentials icon</title>
                <path
                  d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-[color:var(--color-text-emphasis)] text-sm">
              Have credentials already?
            </h3>
            <p className="mt-1.5 text-[color:var(--color-text-muted)] text-sm leading-relaxed">
              Let recruiters know about EMT, CNA, MA, or Phlebotomy licenses so
              they can queue Disaster Action Team or Disaster Health Services
              training after your core GAPs.
            </p>
          </article>
        </div>

        <section>
          <h2 className="font-display font-semibold text-2xl text-[color:var(--color-text-emphasis)]">
            What &ldquo;deployment&rdquo; means
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {deploymentNotes.map((note) => (
              <div
                className="editorial-card-soft rounded-2xl p-5 text-[color:var(--color-text-muted)] text-sm leading-relaxed"
                key={note}
              >
                {note}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display font-semibold text-2xl text-[color:var(--color-text-emphasis)]">
            General steps to deploy
          </h2>
          <p className="mt-2 text-[color:var(--color-text-muted)] text-sm">
            Follow this path to move from club member to deployable volunteer.
          </p>
          <ol className="relative mt-6 space-y-0">
            {steps.map((step, index) => (
              <li
                className="relative flex gap-5 pb-8 last:pb-0"
                key={step.title}
              >
                {index < steps.length - 1 && (
                  <div className="absolute top-11 left-5 h-[calc(100%-2.75rem)] w-px bg-gradient-to-b from-red-200 to-slate-100" />
                )}
                <div
                  className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 font-bold text-sm text-white shadow-md shadow-red-600/20"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {index + 1}
                </div>
                <div className="editorial-card flex-1 rounded-2xl p-5 transition-colors duration-200">
                  <h3 className="font-semibold text-[color:var(--color-text-emphasis)]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[color:var(--color-text-muted)] text-sm leading-relaxed">
                    {step.body}
                  </p>
                  {step.link ? (
                    <Link
                      className="mt-3 inline-flex font-semibold text-red-600 text-sm underline-offset-4 transition-colors duration-150 hover:underline"
                      href={step.link.href}
                    >
                      {step.link.label}
                      <span className="ml-1">&rarr;</span>
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <p className="font-semibold text-slate-400 text-xs uppercase tracking-wider">
            Figure 1
          </p>
          <h2 className="mt-1 font-display font-semibold text-2xl text-[color:var(--color-text-emphasis)]">
            Understanding the GAP chart
          </h2>
          <p className="mt-2 text-[color:var(--color-text-muted)] text-sm">
            Align your interests with the right Group, Activity, and Position
            before you request training.
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-[color:var(--color-border)]/80 shadow-sm">
            <Image
              alt="American Red Cross Group/Activity/Position (GAP) Chart showing Disaster Cycle Services organizational structure"
              className="h-auto w-full"
              height={1545}
              src="/gap-chart.jpg"
              width={2000}
            />
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {gapLegend.map((item) => (
              <article
                className="editorial-card-soft rounded-2xl p-5"
                key={item.title}
              >
                <h3 className="font-semibold text-[color:var(--color-text-emphasis)] text-sm">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[color:var(--color-text-muted)] text-sm">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            Light blue = client-facing, yellow = first-time volunteer
            priorities, green = best for volunteers with health licenses.
          </p>
        </section>

        <section className="editorial-card-soft rounded-2xl p-6 sm:p-8">
          <h2 className="font-display font-semibold text-[color:var(--color-text-emphasis)] text-lg">
            General reminders
          </h2>
          <ul className="mt-4 space-y-3">
            {reminderItems.map((item) => (
              <li
                className="flex items-start gap-3 text-slate-500 text-sm leading-relaxed"
                key={item}
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
