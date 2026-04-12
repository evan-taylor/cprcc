"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import SiteHeader from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageLoader } from "@/components/ui/page-loader";
import { api } from "@/convex/_generated/api";

export default function NewsletterPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const settings = useQuery(
    api.newsletters.getNewsletterSettings,
    isAuthenticated ? {} : "skip"
  );
  const setNewsletterSubscription = useMutation(
    api.newsletters.setCurrentUserNewsletterSubscription
  );

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!(authLoading || isAuthenticated)) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, router]);

  if (
    authLoading ||
    currentUser === undefined ||
    (isAuthenticated && settings === undefined)
  ) {
    return (
      <div className="min-h-screen bg-[color:var(--color-bg)]">
        <SiteHeader />
        <PageLoader
          detail="Loading your newsletter preferences and subscription status."
          fullScreen={false}
          message="Loading newsletter preferences..."
        />
      </div>
    );
  }

  if (!isAuthenticated || currentUser === null || !settings) {
    return null;
  }

  const isSubscribed = settings.newsletterStatus === "subscribed";

  const handleSubscriptionChange = async (subscribed: boolean) => {
    if (subscribed === isSubscribed) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await setNewsletterSubscription({ subscribed });
      if (result.newsletterStatus === "subscribed") {
        toast.success("You’re subscribed to CPRCC newsletters.");
      } else {
        toast.success("You’ve been unsubscribed from CPRCC newsletters.");
      }
    } catch (nextError) {
      toast.error(
        nextError instanceof Error
          ? nextError.message
          : "Unable to update newsletter preferences"
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)]">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="editorial-kicker animate-fade-up">Newsletter</p>
          <h1 className="stagger-1 editorial-title mt-3 animate-fade-up text-3xl sm:text-4xl">
            Email preferences
          </h1>
          <p className="stagger-2 mt-2 max-w-2xl animate-fade-up text-[color:var(--color-text-muted)]">
            Manage whether you receive club newsletters, volunteer updates, and
            chapter announcements in your inbox.
          </p>
        </header>

        <div className="space-y-6">
          <Card className="rounded-[1.75rem]">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Subscription status</CardTitle>
                <CardDescription>
                  Newsletter emails are sent to {settings.email}.
                </CardDescription>
              </div>
              <Badge variant={isSubscribed ? "success" : "warning"}>
                {isSubscribed ? "Subscribed" : "Unsubscribed"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  className={`rounded-[1.25rem] border px-5 py-5 text-left transition-all ${
                    isSubscribed
                      ? "border-green-200 bg-green-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  disabled={isSaving}
                  onClick={() => handleSubscriptionChange(true)}
                  type="button"
                >
                  <p className="font-semibold text-slate-900 text-sm">
                    Stay subscribed
                  </p>
                  <p className="mt-2 text-slate-500 text-sm">
                    Receive newsletters, event announcements, and highlights
                    from the club.
                  </p>
                </button>

                <button
                  className={`rounded-[1.25rem] border px-5 py-5 text-left transition-all ${
                    isSubscribed
                      ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      : "border-orange-200 bg-orange-50 shadow-sm"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  disabled={isSaving}
                  onClick={() => handleSubscriptionChange(false)}
                  type="button"
                >
                  <p className="font-semibold text-slate-900 text-sm">
                    Unsubscribe
                  </p>
                  <p className="mt-2 text-slate-500 text-sm">
                    Stop future newsletter campaigns while keeping your CPRCC
                    account active.
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
