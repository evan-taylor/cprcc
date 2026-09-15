"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

// A failed chunk fetch cannot be recovered by re-rendering: reset() reruns the
// same code path against the same missing asset. A full reload fetches fresh
// HTML that points at the current deployment's chunks.
const CHUNK_RELOAD_KEY = "chunk-load-reloads";
// Reload at most this many times per tab session. A chunk that stays missing
// then reaches the stable error page below instead of looping, whatever the
// delay between one reload and the next failure. A count, not a time window,
// because a failure that recurs slower than any window would defeat it.
const MAX_CHUNK_RELOADS = 2;

// sessionStorage throws when access is denied or the quota is exhausted. A failed
// read or write must not stop the exception from being reported, so skip the
// reload in that case: without the counter the loop can no longer be bounded.
const shouldReloadForChunkError = (): boolean => {
  try {
    const reloads = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY)) || 0;
    if (reloads >= MAX_CHUNK_RELOADS) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(reloads + 1));
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
