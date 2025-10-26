"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
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

const scrollThreshold = 80;

type HeaderVariant = "default" | "inverted";

export default function SiteHeader({
  variant = "default",
}: {
  variant?: HeaderVariant;
} = {}) {
  const [scrolled, setScrolled] = useState(false);

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
    ? "bg-transparent text-white border-transparent"
    : "bg-white text-slate-900 border-slate-200 shadow-sm";
  const navLinkClasses = transparent
    ? "text-white/90 hover:text-white"
    : "text-slate-600 hover:text-rose-700";
  const brandClasses = transparent ? "text-white" : "text-rose-700";
  return (
    <header
      className={`fixed top-0 z-30 w-full border-b backdrop-blur transition-colors ${headerClasses}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          className={`font-semibold text-lg tracking-wide ${brandClasses}`}
          href="/"
        >
          Cal Poly Red Cross Club
        </Link>
        <div className="flex flex-1 items-center justify-end gap-4">
          <nav className="hidden gap-6 font-medium text-sm md:flex">
            {navItems.map((item) => (
              <Link
                className={`transition-colors ${navLinkClasses}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <AuthButton inverted={transparent} />
        </div>
      </div>
      <nav className="flex flex-wrap gap-4 px-4 pb-4 font-medium text-sm md:hidden">
        {navItems.map((item) => (
          <Link
            className={`transition-colors ${navLinkClasses}`}
            href={item.href}
            key={`mobile-${item.href}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function AuthButton({ inverted }: { inverted: boolean }) {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const currentUser = useQuery(api.users.getCurrentUser);
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <Link
        className={`rounded-full border px-4 py-2 font-semibold text-sm transition ${
          inverted
            ? "border-white/70 text-white hover:border-white hover:text-white"
            : "border-slate-300 text-slate-700 hover:border-rose-400 hover:text-rose-700"
        }`}
        href="/signin"
      >
        Sign in
      </Link>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/signin");
  };

  return (
    <div className="flex items-center gap-3">
      {currentUser?.role === "board" && (
        <Link
          className={`rounded-lg px-3 py-1.5 font-medium text-sm transition ${
            inverted
              ? "text-white/90 hover:bg-white/10 hover:text-white"
              : "text-slate-700 hover:bg-slate-100 hover:text-rose-700"
          }`}
          href="/admin"
        >
          Admin
        </Link>
      )}
      <div className="flex items-center gap-2">
        {currentUser && (
          <span
            className={`font-medium text-sm ${inverted ? "text-white/90" : "text-slate-700"}`}
          >
            {currentUser.name}
          </span>
        )}
        <button
          className={`rounded-full px-4 py-2 font-semibold text-sm text-white shadow-sm transition ${
            inverted
              ? "bg-white/20 hover:bg-white/30"
              : "bg-rose-600 hover:bg-rose-700"
          }`}
          onClick={handleSignOut}
          type="button"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
