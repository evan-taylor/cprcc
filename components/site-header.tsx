"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { api } from "@/convex/_generated/api";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/volunteer-connection", label: "Volunteer Connection" },
  { href: "/deployment", label: "Deployment" },
  { href: "/contact", label: "Contact" },
];

const SCROLL_THRESHOLD = 20;

type HeaderVariant = "default" | "inverted";

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname.startsWith(href);
};

export default function SiteHeader({
  variant = "default",
}: {
  variant?: HeaderVariant;
} = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const pathname = usePathname();
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavPanelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMobileMenu();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileMenuOpen, closeMobileMenu]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }
    const panel = mobileNavPanelRef.current;
    if (!panel) {
      return;
    }
    const firstLink = panel.querySelector<HTMLElement>("a[href]");
    requestAnimationFrame(() => {
      firstLink?.focus();
    });
  }, [mobileMenuOpen]);

  const prevMobileMenuOpenRef = useRef(false);
  useEffect(() => {
    if (prevMobileMenuOpenRef.current && !mobileMenuOpen) {
      requestAnimationFrame(() => {
        mobileMenuButtonRef.current?.focus();
      });
    }
    prevMobileMenuOpenRef.current = mobileMenuOpen;
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }
    const panel = mobileNavPanelRef.current;
    if (!panel) {
      return;
    }
    const getFocusables = () =>
      [...panel.querySelectorAll<HTMLElement>("a[href]")].filter(
        (el) => el.offsetParent !== null
      );
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") {
        return;
      }
      const list = getFocusables();
      if (list.length === 0) {
        return;
      }
      const first = list[0];
      const last = list.at(-1);
      if (!last) {
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", handleKeyDown);
    return () => panel.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const isInverted = variant === "inverted";
  const transparent = isInverted && !scrolled;
  const desktopNavLinkClass = (href: string) => {
    const active = isActivePath(pathname, href);
    if (transparent) {
      if (active) {
        return "bg-white/22 text-white shadow-sm";
      }
      return "text-white/88 hover:bg-white/15 hover:text-white";
    }
    if (active) {
      return "bg-[color:var(--color-bg-subtle)] text-[color:var(--color-text-emphasis)] shadow-sm";
    }
    return "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-emphasis)]";
  };
  const mobileNavLinkClass = (href: string) => {
    if (isActivePath(pathname, href)) {
      return "bg-[color:var(--color-bg-subtle)] text-[color:var(--color-text-emphasis)]";
    }
    return "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-subtle)] hover:text-[color:var(--color-text-emphasis)] active:bg-[color:var(--color-bg-subtle)]";
  };

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          transparent
            ? "border-white/20 border-b bg-[color:var(--surface-glass)]/5 text-white backdrop-blur-2xl"
            : "border-[color:var(--color-border)]/70 border-b bg-[color:var(--surface-glass-strong)] text-[color:var(--color-text)] shadow-sm backdrop-blur-2xl"
        }`}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link
            aria-label="Cal Poly Red Cross Club — Home"
            className={`group flex items-center gap-2.5 font-display text-lg tracking-tight transition-colors duration-200 ${
              transparent
                ? "text-white"
                : "text-[color:var(--color-primary)] hover:text-[color:var(--color-primary-hover)]"
            }`}
            href="/"
          >
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/95 shadow-sm ring-1 ring-black/5 transition-transform duration-200 group-hover:scale-[1.03]">
              <Image
                alt=""
                className="h-6 w-6"
                height={24}
                src="/redcross.svg"
                width={24}
              />
            </span>
            <span className="max-w-[11rem] leading-tight sm:max-w-none">
              Cal Poly Red Cross Club
            </span>
          </Link>
          <div className="flex flex-1 items-center justify-end gap-5">
            <nav className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => (
                <Link
                  className={`rounded-lg px-3.5 py-2 font-medium text-sm transition-all duration-150 ${desktopNavLinkClass(item.href)}`}
                  href={item.href}
                  key={item.href}
                >
                  {item.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <Link
                  className={`rounded-lg px-3.5 py-2 font-medium text-sm transition-all duration-150 ${desktopNavLinkClass("/newsletter")}`}
                  href="/newsletter"
                >
                  Newsletter
                </Link>
              ) : null}
              {isAuthenticated && currentUser?.role === "board" && (
                <Link
                  className={`rounded-lg px-3.5 py-2 font-medium text-sm transition-all duration-150 ${desktopNavLinkClass("/admin")}`}
                  href="/admin"
                >
                  Admin
                </Link>
              )}
            </nav>

            <MobileMenuButton
              iconColor={transparent ? "white" : "#334155"}
              isOpen={mobileMenuOpen}
              menuButtonRef={mobileMenuButtonRef}
              onToggle={() => setMobileMenuOpen((prev) => !prev)}
            />

            <AuthButton inverted={transparent} />
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <button
        aria-label="Close navigation menu"
        className={`fixed inset-0 z-40 bg-black/25 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobileMenu}
        tabIndex={-1}
        type="button"
      />

      {/* Mobile menu panel */}
      <nav
        aria-label="Mobile navigation"
        className={`fixed top-[72px] right-4 left-4 z-50 rounded-2xl border border-[color:var(--color-border)]/70 bg-[color:var(--surface-glass-strong)] shadow-lg backdrop-blur-xl transition-all duration-[250ms] md:hidden ${
          mobileMenuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        }`}
        id="mobile-navigation-panel"
        ref={mobileNavPanelRef}
        style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
      >
        <div className="flex flex-col px-3 py-3">
          {navItems.map((item, index) => (
            <Link
              className={`rounded-xl px-4 py-3 font-medium text-sm transition-colors duration-150 ${mobileNavLinkClass(item.href)} ${
                mobileMenuOpen ? "animate-slide-down" : ""
              }`}
              href={item.href}
              key={`mobile-${item.href}`}
              onClick={closeMobileMenu}
              style={{
                animationDelay: mobileMenuOpen ? `${index * 30}ms` : "0ms",
              }}
            >
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <Link
              className={`rounded-xl px-4 py-3 font-medium text-sm transition-colors duration-150 ${mobileNavLinkClass(
                "/newsletter"
              )}`}
              href="/newsletter"
              onClick={closeMobileMenu}
            >
              Newsletter
            </Link>
          ) : null}
          {isAuthenticated && currentUser?.role === "board" && (
            <Link
              className={`rounded-xl px-4 py-3 font-medium text-sm transition-colors duration-150 ${mobileNavLinkClass(
                "/admin"
              )}`}
              href="/admin"
              onClick={closeMobileMenu}
            >
              Admin
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}

function MobileMenuButton({
  isOpen,
  onToggle,
  iconColor,
  menuButtonRef,
}: {
  isOpen: boolean;
  onToggle: () => void;
  iconColor: string;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      aria-controls="mobile-navigation-panel"
      aria-expanded={isOpen}
      aria-label="Toggle navigation menu"
      className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors duration-150 hover:bg-[color:var(--color-bg-subtle)] active:scale-95 md:hidden"
      onClick={onToggle}
      ref={menuButtonRef}
      type="button"
    >
      <svg
        className="h-5 w-5 transition-transform duration-200"
        fill="none"
        stroke={iconColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        style={{
          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
          transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
        }}
        viewBox="0 0 24 24"
      >
        <title>{isOpen ? "Close menu" : "Open menu"}</title>
        {isOpen ? (
          <path d="M6 18L18 6M6 6l12 12" />
        ) : (
          <path d="M4 6h16M4 12h16M4 18h16" />
        )}
      </svg>
    </button>
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
    if (!isAuthenticated || currentUser === undefined || profileEnsured) {
      return;
    }

    ensureCurrentUserProfile({})
      .then(() => {
        setProfileEnsured(true);
      })
      .catch(() => {
        // Silently ignore profile creation errors (important-comment)
      });
  }, [isAuthenticated, currentUser, ensureCurrentUserProfile, profileEnsured]);

  if (!isAuthenticated) {
    return (
      <Link
        className={`inline-flex h-11 items-center rounded-lg px-5 font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 ${
          inverted
            ? "bg-white/15 text-white ring-1 ring-white/25 ring-inset backdrop-blur-sm hover:bg-white/25 focus-visible:ring-white/60"
            : "bg-red-600 text-white shadow-md shadow-red-600/25 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg focus-visible:ring-red-500"
        }`}
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
      className={`inline-flex h-11 items-center rounded-lg px-5 font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 ${
        inverted
          ? "bg-white/15 text-white ring-1 ring-white/25 ring-inset backdrop-blur-sm hover:bg-white/25 focus-visible:ring-white/60"
          : "bg-red-600 text-white shadow-md shadow-red-600/25 hover:-translate-y-0.5 hover:bg-red-700 hover:shadow-lg focus-visible:ring-red-500"
      }`}
      onClick={handleSignOut}
      type="button"
    >
      Sign Out
    </button>
  );
}
