"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

// A failed chunk fetch cannot be recovered by re-rendering: reset() reruns the
// same code path against the same missing asset. A full reload fetches fresh
// HTML that points at the current deployment's chunks.
const CHUNK_RELOAD_KEY = "chunk-load-reloaded-at";
// Reload at most once inside this window. A chunk that stays missing fails again
// within it and shows the page below instead of looping, while a separate
// failure later in the same tab falls outside it and gets its own recovery.
const CHUNK_RELOAD_WINDOW_MS = 10_000;

// sessionStorage throws when access is denied or the quota is exhausted, so a
// failed read or write must not stop the exception from being reported. In that
// case skip the reload, since the guard against a loop is no longer reliable.
const shouldReloadForChunkError = (): boolean => {
  try {
    const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY));
    if (Date.now() - lastReloadAt < CHUNK_RELOAD_WINDOW_MS) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
};

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    if (error.name === "ChunkLoadError" && shouldReloadForChunkError()) {
      window.location.reload();
      return;
    }

    posthog.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main>
          <h1>Something went wrong</h1>
          <p>
            Please try again. If the problem continues, contact us for help.
          </p>
          <button onClick={reset} type="button">
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
