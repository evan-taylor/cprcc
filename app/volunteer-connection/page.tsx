import Link from "next/link";
import SiteHeader from "@/components/site-header";

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
          className="font-semibold text-rose-700 underline-offset-4 hover:underline"
          href={webSignupUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          redcross.org/local/california/central-california/volunteer/red-cross-clubs.html
        </Link>{" "}
        for the official American Red Cross club directory.
      </>
    ),
  },
  {
    title: "Pick Cal Poly SLO",
    body: "Scroll to the “College / University” section, choose “San Luis Obispo County,” then select “California Polytechnic State University.”",
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
    body: "Provide a clear photo of your driver’s license (or other government ID), then click Continue to Background Check.",
  },
  {
    title: "Authorize the background screening",
    body: "Verify your personal information, open the acknowledgement dropdowns, check the dotted box, and press “Authorize Background Check.”",
  },
  {
    title: "Finish the prompts",
    body: "Complete the final questions, enter your SSN when requested, and click submit. You’re all set!",
  },
];

export default async function VolunteerConnectionPage() {
  "use cache";
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pt-32 pb-20 sm:px-8 lg:px-12">
        <HeroCard />
        <StepsSection />
      </main>
    </div>
  );
}

function HeroCard() {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <div className="space-y-4">
        <p className="text-rose-700 text-sm uppercase tracking-[0.3em]">
          Volunteer Connection
        </p>
        <h1 className="font-semibold text-4xl text-slate-900">
          Get fully approved in eight steps
        </h1>
        <p className="text-lg text-slate-700">
          This quick walkthrough mirrors what you’ll see inside Volunteer
          Connection. Grab your ID, a good internet connection, and 10 minutes.
          Once you’re done, the Red Cross will verify your profile, and you’ll
          be cleared to sign up for Red Cross volunteer oppurtunities and log
          your hours!
        </p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-slate-500 text-sm uppercase tracking-wide">
            Need help?
          </p>
          <p className="mt-2 text-slate-900">
            Email{" "}
            <Link
              className="font-semibold text-rose-700 underline-offset-4 hover:underline"
              href="mailto:redcrossclub@calpoly.edu"
            >
              redcrossclub@calpoly.edu
            </Link>{" "}
            and we’ll walk you through it.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-slate-500 text-sm uppercase tracking-wide">
            Have these items
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600 text-sm">
            <li>Driver’s license or other government ID</li>
            <li>Social Security Number</li>
            <li>Your Cal Poly email address</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="rounded-3xl border border-white/80 bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <ol className="relative space-y-6">
        <div className="pointer-events-none absolute top-0 left-5 hidden h-full w-px bg-linear-to-b from-rose-200 via-rose-300 to-transparent md:block" />
        {steps.map((step, index) => (
          <li className="relative flex gap-4 md:gap-6" key={step.title}>
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-600 font-semibold text-white shadow-md">
              {index + 1}
            </div>
            <div className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <h3 className="font-semibold text-base text-slate-900">
                {step.title}
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
