"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import posthog from "posthog-js";
import { type ReactNode, useEffect, useRef } from "react";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is not set");
}

const convex = new ConvexReactClient(convexUrl);

function PostHogIdentity() {
  const { isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!(isAuthenticated && currentUser)) {
      return;
    }

    const userId = String(currentUser._id);
    if (identifiedUserId.current === userId) {
      return;
    }

    if (posthog.get_distinct_id() === userId) {
      identifiedUserId.current = userId;
      return;
    }

    if (identifiedUserId.current) {
      posthog.reset();
    }

    posthog.identify(userId, {
      email: currentUser.email,
      name: currentUser.name,
      role: currentUser.role,
    });
    identifiedUserId.current = userId;
  }, [currentUser, isAuthenticated]);

  return null;
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexAuthNextjsProvider client={convex}>
      <PostHogIdentity />
      {children}
    </ConvexAuthNextjsProvider>
  );
}
