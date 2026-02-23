import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Volunteer Connection Signup",
  description:
    "Step-by-step guide to join Cal Poly Red Cross Club through Volunteer Connection. Complete your Red Cross ID, background check, and get approved to volunteer in 8 easy steps.",
  openGraph: {
    title: "Volunteer Connection Signup | Cal Poly Red Cross Club",
    description:
      "Step-by-step guide to join Cal Poly Red Cross Club through Volunteer Connection. Complete your Red Cross ID, background check, and get approved to volunteer.",
    url: "https://calpolyredcross.org/volunteer-connection",
  },
  alternates: {
    canonical: "/volunteer-connection",
  },
};

const webSignupUrl =
  "https://www.redcross.org/local/california/central-california/volunteer/red-cross-clubs.html";

const steps: {
  title: string;
  body: React.ReactNode;
}[] = [
  {
    title: "Open Volunteer Connection",
    body: (
      <>
        Head to{" "}
        <Link
          className="font-semibold text-red-600 underline-offset-4 hover:underline"
          href={webSignupUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          the Red Cross club directory
        </Link>{" "}
        for the official American Red Cross club directory.
      </>
    ),
  },
  {
    title: "Pick Cal Poly SLO",
    body: "Scroll to the \u201CCollege / University\u201D section, choose \u201CSan Luis Obispo County,\u201D then select \u201CCalifornia Polytechnic State University.\u201D",
  },
  {
    title: "Create or move your Red Cross ID",
    body: "Log in or create a Red Cross ID. Already have one? Email redcrossclub@calpoly.edu so we can transfer your profile to the Cal Poly chapter. Include your name, the email attached to your Red Cross ID, and your current region.",
  },
  {
    title: "Complete the general application",
    body: "Fill out the short form that appears after you select our club.",
  },
  {
    title: "Acknowledge the agreements",
    body: "Expand each acknowledgement dropdown, review the details, and check the dotted certification box before continuing.",
  },
  {
    title: "Upload your ID",
    body: "Provide a clear photo of your driver\u2019s license (or other government ID), then click Continue to Background Check.",
  },
  {
    title: "Authorize the background screening",
    body: "Verify your personal information, open the acknowledgement dropdowns, check the dotted box, and press \u201CAuthorize Background Check.\u201D",
  },
  {
    title: "Finish the prompts",
    body: "Complete the final questions, enter your SSN when requested, and click submit. You\u2019re all set!",
  },
];

const TOTAL_STEPS = 8;

export default async function VolunteerConnectionPage() {
  "use cache";
  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 pt-28 pb-24 sm:px-8">
        <header className="max-w-xl">
          <p className="editorial-kicker animate-fade-up">
            Volunteer Connection
          </p>
          <h1 className="stagger-1 editorial-title mt-3 animate-fade-up">
            Get approved in {TOTAL_STEPS} steps
          </h1>
          <p className="stagger-2 editorial-lead mt-4 animate-fade-up">
            This quick walkthrough mirrors what you&apos;ll see inside Volunteer
            Connection. Grab your ID, a good internet connection, and 10
            minutes.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="editorial-card-soft rounded-2xl p-6">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <title>Help icon</title>
                <path
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-[color:var(--color-text-emphasis)] text-sm">
              Need help?
            </h3>
            <p className="mt-1.5 text-[color:var(--color-text-muted)] text-sm">
              Email{" "}
              <Link
                className="font-medium text-red-600 underline-offset-4 hover:underline"
                href="mailto:redcrossclub@calpoly.edu"
              >
                redcrossclub@calpoly.edu
              </Link>{" "}
              and we&apos;ll walk you through it.
            </p>
          </div>
          <div className="editorial-card-soft rounded-2xl p-6">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <title>Checklist icon</title>
                <path
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-[color:var(--color-text-emphasis)] text-sm">
              Have these items ready
            </h3>
            <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-[color:var(--color-text-muted)] text-sm">
              <li>Driver&apos;s license or other government ID</li>
              <li>Social Security Number</li>
              <li>Your Cal Poly email address</li>
            </ul>
          </div>
        </div>

        <section>
          <ol className="relative space-y-0">
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
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="editorial-card-soft rounded-2xl p-6 text-center sm:p-8">
          <h3 className="font-display font-semibold text-[color:var(--color-text-emphasis)] text-lg">
            All done?
          </h3>
          <p className="mt-2 text-[color:var(--color-text-muted)] text-sm">
            Once you&apos;re done, the Red Cross will verify your profile, and
            you&apos;ll be cleared to sign up for volunteer opportunities and
            log your hours.
          </p>
          <Link
            className="mt-5 inline-flex h-11 items-center rounded-full bg-red-600 px-7 font-semibold text-sm text-white shadow-md shadow-red-600/20 transition-all duration-200 hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/25 active:scale-[0.97]"
            href="/events"
          >
            Browse Events
          </Link>
        </div>
      </main>
    </div>
  );
}
