import Link from "next/link";
import SiteHeader from "@/components/site-header";

const contacts = [
  {
    label: "Email",
    value: "redcrossclub@calpoly.edu",
    link: "mailto:redcrossclub@calpoly.edu",
  },
  {
    label: "GroupMe",
    value: "groupme.com/join_group/110362987/vWy9gKFG",
    link: "https://groupme.com/join_group/110362987/vWy9gKFG",
  },
  {
    label: "Instagram",
    value: "@calpolyredcrossclub",
    link: "https://www.instagram.com/calpolyredcrossclub",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 pt-32 pb-20 sm:px-8">
        <HeroSection />
        <ContactTiles />
      </main>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <p className="text-rose-700 text-sm uppercase tracking-[0.3em]">
        Contact
      </p>
      <h1 className="font-semibold text-4xl text-slate-900">
        Get in touch with Red Cross Club
      </h1>
      <p className="mt-4 text-lg text-slate-700">
        We’re here to help. Reach out to us anytime!
      </p>
    </section>
  );
}

function ContactTiles() {
  return (
    <section className="rounded-3xl border border-white/80 bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="grid gap-4 md:grid-cols-3">
        {contacts.map((contact) => {
          const isExternal = contact.link.startsWith("http");
          return (
            <Link
              className="flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-rose-300 hover:shadow-sm"
              href={contact.link}
              key={contact.label}
              rel={isExternal ? "noopener noreferrer" : undefined}
              target={isExternal ? "_blank" : undefined}
            >
              <span className="text-slate-500 text-sm uppercase tracking-wide">
                {contact.label}
              </span>
              <span className="mt-2 break-all font-semibold text-slate-900">
                {contact.value}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
