import type { CaptureResult } from "posthog-js";
import posthog from "posthog-js";

const POSTHOG_PROJECT_TOKEN =
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN ??
  process.env.NEXT_PUBLIC_POSTHOG_KEY;

// Bare browser fetch failures carry no application context: a transient network
// blip (offline, DNS, CORS, a cancelled request) rejects with one of these exact
// messages and no app frame. They are not actionable, yet autocapture would open
// a fresh high-severity issue for each one. Our own fetch calls wrap failures in
// a specific message (for example "Failed to upload image"), so matching the bare
// message drops only the unactionable case.
const UNACTIONABLE_NETWORK_MESSAGES = new Set([
  "Failed to fetch", // Chromium
  "Load failed", // Safari
  "NetworkError when attempting to fetch resource.", // Firefox
]);

const isUnactionableNetworkError = (event: CaptureResult): boolean => {
  if (event.event !== "$exception") {
    return false;
  }

  // posthog-js sets $exception_list client-side; each entry carries the error
  // type and message. The $exception_types / $exception_values arrays are
  // derived server-side and are absent here in before_send.
  const exceptions = event.properties.$exception_list;
  if (!Array.isArray(exceptions) || exceptions.length === 0) {
    return false;
  }

  return exceptions.every(
    (exception) =>
      exception?.type === "TypeError" &&
      typeof exception.value === "string" &&
      UNACTIONABLE_NETWORK_MESSAGES.has(exception.value.trim())
  );
};

const dropUnactionableNetworkErrors = (
  event: CaptureResult | null
): CaptureResult | null => {
  if (event && isUnactionableNetworkError(event)) {
    return null;
  }
  return event;
};

// The Meta in-app browser (Instagram, Facebook) injects a native bridge script
// into every page it opens. That script reads window.webkit.messageHandlers
// before the bridge exists and throws a TypeError. The throw is in injected
// code, not ours — the repository never references webkit or messageHandlers —
// but the injected script has no file of its own, so autocapture attributes it
// to the visited page and opens a high-severity issue. Instagram links are a
// main path to our event pages, so this recurs. Match the injected global in the
// message to drop this class, including the same shape from other in-app
// browsers.
const INJECTED_BRIDGE_MESSAGE_MARKER = "webkit.messageHandlers";

const isInjectedInAppBrowserError = (event: CaptureResult): boolean => {
  if (event.event !== "$exception") {
    return false;
  }

  const exceptions = event.properties.$exception_list;
  if (!Array.isArray(exceptions) || exceptions.length === 0) {
    return false;
  }

  return exceptions.every(
    (exception) =>
      exception?.type === "TypeError" &&
      typeof exception.value === "string" &&
      exception.value.includes(INJECTED_BRIDGE_MESSAGE_MARKER)
  );
};

const dropInjectedInAppBrowserErrors = (
  event: CaptureResult | null
): CaptureResult | null => {
  if (event && isInjectedInAppBrowserError(event)) {
    return null;
  }
  return event;
};

// A ChunkLoadError means the browser could not fetch a Next.js static chunk: a
// stale or unreachable deployment asset, or a request dropped inside an in-app
// browser. It is not a defect in a route or component, and it clears when the
// page reloads against the current deployment (see app/global-error.tsx). Left
// alone, autocapture opens a fresh high-severity issue for each one. Match the
// error type to drop this class.
const isChunkLoadError = (event: CaptureResult): boolean => {
  if (event.event !== "$exception") {
    return false;
  }

  const exceptions = event.properties.$exception_list;
  if (!Array.isArray(exceptions) || exceptions.length === 0) {
    return false;
  }

  return exceptions.every((exception) => exception?.type === "ChunkLoadError");
};

const dropChunkLoadErrors = (
  event: CaptureResult | null
): CaptureResult | null => {
  if (event && isChunkLoadError(event)) {
    return null;
  }
  return event;
};

if (POSTHOG_PROJECT_TOKEN) {
  posthog.init(POSTHOG_PROJECT_TOKEN, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-01-30",
    capture_exceptions: true,
    before_send: [
      dropUnactionableNetworkErrors,
      dropInjectedInAppBrowserErrors,
      dropChunkLoadErrors,
    ],
    debug: process.env.NODE_ENV === "development",
  });
}
