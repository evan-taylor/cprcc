"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      closeButton
      position="top-center"
      richColors
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-lg",
        },
      }}
    />
  );
}
