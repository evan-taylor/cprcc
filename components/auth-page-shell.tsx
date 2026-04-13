import type { ReactNode } from "react";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";

export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[100svh] flex-col bg-gradient-to-b from-[color:var(--color-bg)] to-[color:var(--color-bg-subtle)]">
      <SiteHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 pt-24 sm:pt-28">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
