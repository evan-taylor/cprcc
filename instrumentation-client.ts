import posthog from "posthog-js";

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const posthogAssetsHost = process.env.NEXT_PUBLIC_POSTHOG_ASSETS_HOST;
const missingVariable = Object.entries({
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: projectToken,
  NEXT_PUBLIC_POSTHOG_HOST: posthogHost,
  NEXT_PUBLIC_POSTHOG_ASSETS_HOST: posthogAssetsHost,
}).find(([, value]) => !value)?.[0];

if (missingVariable === undefined) {
  posthog.init(projectToken as string, {
    api_host: "/ingest",
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
} else if (process.env.NODE_ENV === "development") {
  throw new Error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
  );
}
