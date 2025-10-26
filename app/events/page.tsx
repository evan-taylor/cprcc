import Link from "next/link";
import SiteHeader from "@/components/site-header";

const focusAreas = [
  {
    title: "Volunteer projects",
    description:
      "Community preparedness campaigns, Sound the Alarm canvassing, and collection drives.",
  },
  {
    title: "Blood services",
    description:
      "Campus blood drives in partnership with Vitalant and Red Cross mobile teams.",
  },
  {
    title: "Training & onboarding",
    description:
      "Disaster Cycle Services 101, shelter fundamentals, and other credentials that prep you to deploy.",
  },
];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 pt-10 pb-16 sm:px-8 md:px-12">
        <header className="space-y-6">
          <p className="text-rose-700 text-sm uppercase tracking-[0.2em]">
            Events & RSVP
          </p>
          <h1 className="font-semibold text-4xl text-slate-900">
            See where we&apos;re serving next
          </h1>
          <p className="text-lg text-slate-700">
            The board is migrating our signup workflows into Convex so officers
            can publish volunteer shifts, trainings, and blood drives right
            here. Members will be able to sign in, RSVP, and track hours without
            leaving the site.
          </p>
        </header>

        <section className="rounded-3xl border border-rose-300 border-dashed bg-white p-10 text-center shadow-sm">
          <h2 className="font-semibold text-2xl text-slate-900">
            Upcoming events will appear here soon
          </h2>
          <p className="mt-3 text-slate-600 text-sm">
            Until the Convex event manager ships, check Instagram or the GroupMe
            for the latest opportunities. Officers can also share Google Sheets
            signups there while we build the RSVP flow.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 font-semibold text-sm">
            <a
              className="rounded-full border border-rose-200 px-5 py-2 text-rose-700 transition hover:border-rose-400"
              href="https://www.instagram.com/calpolyredcrossclub"
              rel="noopener noreferrer"
              target="_blank"
            >
              Instagram updates
            </a>
            <a
              className="rounded-full border border-rose-200 px-5 py-2 text-rose-700 transition hover:border-rose-400"
              href="https://groupme.com/join_group/103395902/FeigA9Y5"
              rel="noopener noreferrer"
              target="_blank"
            >
              Join the GroupMe
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="font-semibold text-rose-600 text-sm uppercase tracking-wide">
            What we plan
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {focusAreas.map((focus) => (
              <div key={focus.title}>
                <h3 className="font-semibold text-lg text-slate-900">
                  {focus.title}
                </h3>
                <p className="mt-2 text-slate-600 text-sm">
                  {focus.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="font-semibold text-2xl text-slate-900">
            What&apos;s coming soon
          </h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-slate-600 text-sm">
            <li>Officer-only form to create, edit, and archive events.</li>
            <li>Member RSVPs with automatic attendance rosters.</li>
            <li>Convex mutations that track volunteer hours per member.</li>
          </ul>
          <p className="mt-4 text-slate-600 text-sm">
            Want to help architect the event system? Reach out to the tech lead
            via{" "}
            <Link
              className="font-semibold text-rose-700 underline-offset-4 hover:underline"
              href="/contact"
            >
              the contact page
            </Link>{" "}
            and we&apos;ll get you plugged into the build plan.
          </p>
        </section>
      </main>
    </div>
  );
}
