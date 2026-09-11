import { withPostHogConfig } from "@posthog/nextjs-config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    useCache: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "www.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*", // pragma: allowlist secret
      },
    ];
  },
  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

const posthogPersonalApiKey = process.env.POSTHOG_API_KEY;
const posthogProjectId = process.env.POSTHOG_PROJECT_ID;

// Generate hidden browser source maps and upload them to PostHog at build time,
// so production exception stacks resolve to real files instead of the minified
// single-line chunk. The plugin deletes the maps after upload, so they are never
// served to browsers.
//
// Upload runs only when POSTHOG_API_KEY holds a PostHog personal API key ("phx_"
// prefix), which the deploy environment sets on purpose. The plugin fails the
// build when it cannot upload, so gating on the prefix keeps every other build —
// where POSTHOG_API_KEY may hold a project or agent token — on the plain config.
const config =
  posthogPersonalApiKey?.startsWith("phx_") && posthogProjectId
    ? withPostHogConfig(nextConfig, {
        personalApiKey: posthogPersonalApiKey,
        projectId: posthogProjectId,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.posthog.com",
        sourcemaps: { enabled: true },
      })
    : nextConfig;

export default config;
