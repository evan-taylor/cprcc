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

  const types = event.properties.$exception_types;
  const values = event.properties.$exception_values;
  if (
    !(Array.isArray(types) && Array.isArray(values)) ||
    types.length === 0 ||
    types.length !== values.length
  ) {
    return false;
  }

  return types.every((type, index) => {
    const value = values[index];
    return (
      type === "TypeError" &&
      typeof value === "string" &&
      UNACTIONABLE_NETWORK_MESSAGES.has(value.trim())
    );
  });
};

const dropUnactionableNetworkErrors = (
  event: CaptureResult | null
): CaptureResult | null => {
  if (event && isUnactionableNetworkError(event)) {
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
    before_send: dropUnactionableNetworkErrors,
    debug: process.env.NODE_ENV === "development",
  });
}
