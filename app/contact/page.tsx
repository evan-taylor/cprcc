import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/site-header";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Cal Poly Red Cross Club. Contact us via email at redcrossclub@calpoly.edu, join our GroupMe, or follow us on Instagram. We're here to help!",
  openGraph: {
    title: "Contact Us | Cal Poly Red Cross Club",
    description:
      "Get in touch with Cal Poly Red Cross Club. Contact us via email, GroupMe, or Instagram. We're here to help you get involved!",
    url: "https://calpolyredcross.org/contact",
  },
  alternates: {
    canonical: "/contact",
  },
};

const contacts = [
  {
    label: "Email",
    value: "redcrossclub@calpoly.edu",
    link: "mailto:redcrossclub@calpoly.edu",
    description: "Send us a message anytime",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>Email</title>
        <path
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "GroupMe",
    value: "Join our group chat",
    link: "https://groupme.com/join_group/110362987/vWy9gKFG",
    description: "Stay updated on events and activities",
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
      >
        <title>GroupMe</title>
        <path
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "Instagram",
    value: "@calpolyredcrossclub",
    link: "https://www.instagram.com/calpolyredcrossclub",
    description: "Follow us for photos and updates",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <title>Instagram</title>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

export default async function ContactPage() {
  "use cache";
  return (
    <div className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 pt-28 pb-24 sm:px-8">
        <header className="max-w-xl">
          <p className="editorial-kicker animate-fade-up">Contact</p>
          <h1 className="stagger-1 editorial-title mt-3 animate-fade-up">
            Get in touch
          </h1>
          <p className="stagger-2 editorial-lead mt-4 animate-fade-up">
            We&apos;re here to help. Reach out to us through any of these
            channels.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          {contacts.map((contact) => {
            const isExternal = contact.link.startsWith("http");
            return (
              <Link
                className="group editorial-card flex flex-col gap-4 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]"
                href={contact.link}
                key={contact.label}
                rel={isExternal ? "noopener noreferrer" : undefined}
                target={isExternal ? "_blank" : undefined}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500 transition-colors duration-150 group-hover:bg-red-100 group-hover:text-red-600">
                  {contact.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[color:var(--color-text-emphasis)]">
                    {contact.label}
                  </h3>
                  <p className="mt-1 text-[color:var(--color-text-muted)] text-sm">
                    {contact.description}
                  </p>
                </div>
                <span className="mt-auto break-all font-medium text-red-600 text-sm transition-colors duration-150 group-hover:text-red-700">
                  {contact.value}
                  <span className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-0.5">
                    &rarr;
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
