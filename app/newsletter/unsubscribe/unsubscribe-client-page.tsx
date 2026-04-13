"use client";

import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import SiteFooter from "@/components/site-footer";
import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoader } from "@/components/ui/page-loader";
import { api } from "@/convex/_generated/api";

function formatStatusDate(timestamp?: number) {
  if (!timestamp) {
    return "Not set yet";
  }

  return new Date(timestamp).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function NewsletterUnsubscribeClientPage() {
  const searchParams = useSearchParams();
  const token = useMemo(
    () => searchParams.get("token")?.trim() || "",
    [searchParams]
  );
  const subscription = useQuery(
    api.newsletters.getPublicSubscriptionByToken,
    token ? { token } : "skip"
  );
  const unsubscribe = useMutation(
    api.newsletters.unsubscribeFromNewsletterByToken
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnsubscribe = async () => {
    if (!token) {
      toast.error("This unsubscribe link is incomplete.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await unsubscribe({ token });
      toast.success(
        `${result.email} has been unsubscribed from future CPRCC newsletter emails.`
      );
    } catch (nextError) {
      toast.error(
        nextError instanceof Error
          ? nextError.message
          : "Unable to unsubscribe with this link."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[color:var(--color-bg)]">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
          <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="font-medium text-amber-900 text-sm">
              This unsubscribe link is missing a token. Open the link from your
              most recent newsletter email, or contact the club.
            </p>
            <a
              className="mt-3 inline-flex font-medium text-amber-900 text-sm underline"
              href="mailto:RedCrossClub@calpoly.edu"
            >
              RedCrossClub@calpoly.edu
            </a>
          </div>
        </main>
      </div>
    );
  }

  if (subscription === undefined) {
    return (
      <div className="min-h-screen bg-[color:var(--color-bg)]">
        <SiteHeader />
        <PageLoader
          detail="Checking your newsletter unsubscribe link."
          fullScreen={false}
          message="Loading unsubscribe page..."
        />
      </div>
    );
  }

  let unsubscribeLabel = "Unsubscribe";
  if (subscription?.newsletterStatus === "unsubscribed") {
    unsubscribeLabel = "Already unsubscribed";
  } else if (isSubmitting) {
    unsubscribeLabel = "Unsubscribing…";
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="editorial-kicker animate-fade-up">Newsletter</p>
          <h1 className="stagger-1 editorial-title mt-3 animate-fade-up text-3xl sm:text-4xl">
            Unsubscribe from club emails
          </h1>
          <p className="stagger-2 mt-2 max-w-2xl animate-fade-up text-[color:var(--color-text-muted)]">
            Manage whether this email address receives future Cal Poly Red Cross
            Club newsletters.
          </p>
        </header>

        <Card className="rounded-[1.75rem]">
          <CardHeader>
            <CardTitle>Subscription details</CardTitle>
            <CardDescription>
              This page works directly from newsletter emails and doesn’t
              require an account login.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription ? (
              <>
                <div className="rounded-[1.25rem] border border-[color:var(--color-border)] bg-[color:var(--color-bg-subtle)] px-5 py-4">
                  <p className="font-medium text-[color:var(--color-text-emphasis)] text-sm">
                    {subscription.name}
                  </p>
                  <p className="mt-1 text-[color:var(--color-text-muted)] text-sm">
                    {subscription.email}
                  </p>
                  <p className="mt-3 text-[color:var(--color-text-muted)] text-sm">
                    Current status:{" "}
                    <span className="font-medium text-[color:var(--color-text-emphasis)]">
                      {subscription.newsletterStatus}
                    </span>
                  </p>
                  <p className="mt-1 text-[color:var(--color-text-muted)] text-sm">
                    Last updated:{" "}
                    {formatStatusDate(subscription.newsletterStatusUpdatedAt)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    disabled={
                      isSubmitting ||
                      subscription.newsletterStatus === "unsubscribed"
                    }
                    onClick={handleUnsubscribe}
                    type="button"
                    variant="destructive"
                  >
                    {unsubscribeLabel}
                  </Button>
                  <Button
                    onClick={() => window.location.assign("/")}
                    type="button"
                    variant="outline"
                  >
                    Return home
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-5 py-4">
                  <p className="font-medium text-red-700 text-sm">
                    This unsubscribe link is invalid or has expired.
                  </p>
                  <p className="mt-2 text-red-700/80 text-sm">
                    If you still receive CPRCC newsletter emails, contact the
                    club at{" "}
                    <a
                      className="font-medium underline"
                      href="mailto:RedCrossClub@calpoly.edu"
                    >
                      RedCrossClub@calpoly.edu
                    </a>
                    .
                  </p>
                </div>
                <Link
                  className="inline-flex text-red-600 text-sm transition-colors hover:text-red-700"
                  href="/"
                >
                  Return to calpolyredcross.org
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
