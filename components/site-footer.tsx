"use client";

import Link from "next/link";

const footerLinks = [
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/volunteer-connection", label: "Volunteer Connection" },
  { href: "/deployment", label: "Deployment" },
  { href: "/contact", label: "Contact" },
];

const socialLinks = [
  {
    href: "https://www.instagram.com/calpolyredcrossclub",
    label: "Instagram @calpolyredcrossclub",
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <title>Instagram</title>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    href: "https://groupme.com/join_group/110362987/vWy9gKFG",
    label: "GroupMe chat",
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
];

export default function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-[color:var(--color-border)]/80 border-t bg-[color:var(--color-bg-subtle)]/80 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-md">
            <p className="font-display font-semibold text-[color:var(--color-text-emphasis)] text-lg">
              Cal Poly Red Cross Club
            </p>
            <p className="mt-2 text-[color:var(--color-text-muted)] text-sm leading-relaxed">
              Student chapter of the American Red Cross at Cal Poly SLO.
              Volunteer, train, and serve alongside fellow Mustangs.
            </p>
            <a
              className="mt-3 inline-flex font-medium text-[color:var(--color-primary)] text-sm underline-offset-4 hover:underline"
              href="mailto:redcrossclub@calpoly.edu"
            >
              redcrossclub@calpoly.edu
            </a>
          </div>

          <nav aria-label="Footer">
            <p className="font-medium text-[color:var(--color-text-emphasis)] text-sm">
              Explore
            </p>
            <ul className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
              {footerLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    className="text-[color:var(--color-text-muted)] text-sm transition-colors duration-150 hover:text-[color:var(--color-text-emphasis)]"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="font-medium text-[color:var(--color-text-emphasis)] text-sm">
              Connect
            </p>
            <ul className="mt-3 flex gap-3">
              {socialLinks.map((item) => (
                <li key={item.href}>
                  <a
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-text-muted)] transition-colors duration-150 hover:border-[color:var(--color-primary)]/40 hover:text-[color:var(--color-primary)]"
                    href={item.href}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {item.icon}
                    <span className="sr-only">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-[color:var(--color-border)]/60 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[color:var(--color-text-subtle)] text-xs">
            © {currentYear} Cal Poly Red Cross Club. Not an official Red Cross
            website; we are a university student organization affiliated with
            the American Red Cross.
          </p>
          <p className="text-[color:var(--color-text-subtle)] text-xs">
            <Link className="underline-offset-2 hover:underline" href="/">
              Home
            </Link>
            <span aria-hidden="true" className="mx-2">
              ·
            </span>
            <a
              className="underline-offset-2 hover:underline"
              href="https://www.redcross.org"
              rel="noopener noreferrer"
              target="_blank"
            >
              American Red Cross
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
