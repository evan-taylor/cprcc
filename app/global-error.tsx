"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

// A failed chunk fetch cannot be recovered by re-rendering: reset() reruns the
// same code path against the same missing asset. A full reload fetches fresh
// HTML that points at the current deployment's chunks. The flag makes the reload
// fire once per tab session, so a chunk that stays missing shows the page below
// instead of looping.
const CHUNK_RELOAD_FLAG = "chunk-load-reloaded";

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    if (
      error.name === "ChunkLoadError" &&
      sessionStorage.getItem(CHUNK_RELOAD_FLAG) !== "1"
    ) {
      sessionStorage.setItem(CHUNK_RELOAD_FLAG, "1");
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
