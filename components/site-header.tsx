"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/volunteer-connection", label: "Volunteer Connection" },
  { href: "/deployment", label: "Deployment" },
  { href: "/contact", label: "Contact" },
];

const scrollThreshold = 20;

type HeaderVariant = "default" | "inverted";

export default function SiteHeader({
  variant = "default",
}: {
  variant?: HeaderVariant;
} = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > scrollThreshold);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isInverted = variant === "inverted";
  const transparent = isInverted && !scrolled;

  const headerClasses = transparent
    ? "bg-white/5 text-white border-white/10 backdrop-blur-xl"
    : "bg-white/80 text-slate-900 border-slate-200/60 shadow-sm backdrop-blur-xl";
  const navLinkClasses = transparent
    ? "text-white/90 hover:text-white font-medium"
    : "text-slate-900 hover:text-red-600 font-medium";
  const brandClasses = transparent ? "text-white" : "text-red-600";
  const iconColor = transparent ? "white" : "#334155";

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b transition-all duration-200 ${headerClasses}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          className={`font-bold font-display text-lg tracking-tight transition-colors ${brandClasses}`}
          href="/"
        >
          Cal Poly Red Cross Club
        </Link>
        <div className="flex flex-1 items-center justify-end gap-6">
          <nav className="hidden gap-7 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                className={`transition-colors ${navLinkClasses}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
            {isAuthenticated && currentUser?.role === "board" && (
              <Link
                className={`transition-colors ${navLinkClasses}`}
                href="/admin"
              >
                Admin
              </Link>
            )}
          </nav>
          <button
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="rounded-lg p-2 transition-colors hover:bg-slate-100/80 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            type="button"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke={iconColor}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <title>{mobileMenuOpen ? "Close menu" : "Open menu"}</title>
              {mobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <AuthButton inverted={transparent} />
        </div>
      </div>
      {mobileMenuOpen && (
        <nav className="flex flex-col gap-1 border-inherit border-t bg-white/95 px-4 py-3 text-sm backdrop-blur-xl md:hidden">
          {navItems.map((item) => (
            <Link
              className="rounded-lg px-3 py-2.5 font-medium text-slate-900 transition-colors hover:bg-slate-100 hover:text-red-600"
              href={item.href}
              key={`mobile-${item.href}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated && currentUser?.role === "board" && (
            <Link
              className="rounded-lg px-3 py-2.5 font-medium text-slate-900 transition-colors hover:bg-slate-100 hover:text-red-600"
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

function AuthButton({ inverted }: { inverted: boolean }) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.users.getCurrentUser);
  const router = useRouter();
  const ensureCurrentUserProfile = useMutation(
    api.users.ensureCurrentUserProfile
  );
  const [profileEnsured, setProfileEnsured] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (currentUser === undefined) {
      return;
    }
    if (profileEnsured) {
      return;
    }

    ensureCurrentUserProfile({})
      .then(() => {
        setProfileEnsured(true);
      })
      .catch(() => {
        // Silently ignore profile creation errors (important-comment)
      });
  }, [isAuthenticated, currentUser, profileEnsured, ensureCurrentUserProfile]);

  if (!isAuthenticated) {
    const baseClasses =
      "inline-flex h-9 items-center rounded-full px-5 font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95";
    const solidClasses =
      "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500";
    const glassClasses =
      "text-white bg-white/20 ring-1 ring-inset ring-white/30 hover:bg-white/30 backdrop-blur-sm focus-visible:ring-white/60";

    return (
      <Link
        className={`${baseClasses} ${inverted ? glassClasses : solidClasses}`}
        href="/signin"
      >
        Sign In
      </Link>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  return (
    <button
      className={`inline-flex h-9 items-center rounded-full px-5 font-semibold text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 ${
        inverted
          ? "bg-white/20 text-white ring-1 ring-white/30 ring-inset backdrop-blur-sm hover:bg-white/30 focus-visible:ring-white/60"
          : "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500"
      }`}
      onClick={handleSignOut}
      type="button"
    >
      Sign Out
    </button>
  );
}
