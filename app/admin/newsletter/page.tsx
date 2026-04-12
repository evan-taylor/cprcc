"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NewsletterImportPanel } from "@/components/newsletter-import-panel";
import SiteHeader from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
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

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(timestamp?: number) {
  if (!timestamp) {
    return "Not sent yet";
  }

  return dateTimeFormatter.format(new Date(timestamp));
}

function getStatusVariant(status: "sending" | "sent" | "failed") {
  if (status === "sent") {
    return "success";
  }
  if (status === "failed") {
    return "danger";
  }
  return "warning";
}

export default function AdminNewsletterPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const ensureCurrentUserProfile = useMutation(
    api.users.ensureCurrentUserProfile
  );
  const overview = useQuery(
    api.newsletters.getNewsletterAdminOverview,
    isAuthenticated && currentUser?.role === "board" ? {} : "skip"
  );
  const [profileEnsured, setProfileEnsured] = useState(false);

  useEffect(() => {
    if (currentUser === undefined || currentUser === null || profileEnsured) {
      return;
    }

    ensureCurrentUserProfile({})
      .then(() => {
        setProfileEnsured(true);
      })
      .catch(() => {
        // Silently ignore profile creation errors
      });
  }, [currentUser, ensureCurrentUserProfile, profileEnsured]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || currentUser === null) {
      router.push("/signin");
    }
  }, [authLoading, currentUser, isAuthenticated, router]);

  if (
    authLoading ||
    currentUser === undefined ||
    (isAuthenticated && currentUser?.role === "board" && overview === undefined)
  ) {
    return (
      <PageLoader
        detail="Loading newsletter audience and recent campaign history."
        message="Loading newsletter tools..."
      />
    );
  }

  if (!isAuthenticated || currentUser === null) {
    return null;
  }

  if (currentUser.role !== "board") {
    return (
      <div className="min-h-screen bg-[color:var(--color-bg)]">
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <svg
                className="h-7 w-7 text-red-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <title>Access denied</title>
                <path
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="font-bold font-display text-slate-900 text-xl">
              Access Denied
            </h1>
            <p className="mt-2 text-slate-500 text-sm">
              Only board members can manage club newsletters.
            </p>
            <button
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-red-600 px-6 font-semibold text-sm text-white shadow-md shadow-red-600/20 transition-all duration-200 hover:bg-red-700 active:scale-[0.97]"
              onClick={() => router.push("/")}
              type="button"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        <header className="mb-10 space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="editorial-kicker animate-fade-up">Admin</p>
              <h1 className="stagger-1 editorial-title mt-3 animate-fade-up text-3xl sm:text-4xl">
                Newsletter
              </h1>
              <p className="stagger-2 mt-2 max-w-2xl animate-fade-up text-[color:var(--color-text-muted)]">
                Import contacts, review your audience, and open the composer to
                send campaigns.
              </p>
            </div>
            <Button
              className="shrink-0 self-start sm:mt-8"
              onClick={() => router.push("/admin/newsletter/new")}
              size="md"
              type="button"
            >
              Compose & send newsletter
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total newsletter recipients"
              value={overview?.totalNewsletterRecipients ?? 0}
            />
            <StatCard
              label="Members subscribed"
              value={overview?.subscribedMembersCount ?? 0}
            />
            <StatCard
              label="Imported contacts"
              value={overview?.importedSubscribersCount ?? 0}
            />
            <StatCard
              label="Member accounts"
              value={overview?.totalMembersCount ?? 0}
            />
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <section className="space-y-6">
            <NewsletterImportPanel isComposerBusy={false} />
          </section>

          <aside className="space-y-6">
            <Card className="rounded-[1.75rem]">
              <CardHeader>
                <CardTitle>Audience preview</CardTitle>
                <CardDescription>
                  Subscribed member accounts and imported contacts that will
                  receive the next campaign (
                  {overview?.totalNewsletterRecipients ?? 0} total).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="mb-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                    Member accounts
                  </p>
                  <div className="space-y-3">
                    {overview?.subscribedMembersPreview.length ? (
                      overview.subscribedMembersPreview.map((member) => (
                        <div
                          className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                          key={member._id}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 text-sm">
                              {member.name}
                            </p>
                            <p className="truncate text-slate-500 text-xs">
                              {member.email}
                            </p>
                          </div>
                          <Badge variant="success">Subscribed</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-[color:var(--color-text-muted)] text-sm">
                        No subscribed members yet.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="mb-2 font-medium text-slate-700 text-xs uppercase tracking-wide">
                    Imported contacts
                  </p>
                  <div className="space-y-3">
                    {overview?.importedSubscribersPreview.length ? (
                      overview.importedSubscribersPreview.map((row) => (
                        <div
                          className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3"
                          key={row._id}
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900 text-sm">
                              {row.name}
                            </p>
                            <p className="truncate text-slate-500 text-xs">
                              {row.email}
                            </p>
                          </div>
                          <Badge variant="success">Imported</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-[color:var(--color-text-muted)] text-sm">
                        No imported contacts yet. Paste a list in Import
                        subscribers to add external addresses.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem]">
              <CardHeader>
                <CardTitle>Recent campaigns</CardTitle>
                <CardDescription>
                  Review recent sends and confirm audience reach.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overview?.recentCampaigns.length ? (
                  overview.recentCampaigns.map((campaign) => (
                    <div
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                      key={campaign._id}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 text-sm">
                            {campaign.subject}
                          </p>
                          <p className="mt-1 text-slate-500 text-xs">
                            Sent by {campaign.createdByName}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-slate-400">Sent</dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {campaign.sentCount}/{campaign.recipientCount}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-slate-400">Failed</dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {campaign.failedCount}
                          </dd>
                        </div>
                        <div className="col-span-2">
                          <dt className="text-slate-400">Updated</dt>
                          <dd className="mt-1 font-medium text-slate-700">
                            {formatDateTime(
                              campaign.sentAt ?? campaign.createdAt
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  ))
                ) : (
                  <p className="text-[color:var(--color-text-muted)] text-sm">
                    No campaigns have been sent yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="editorial-card rounded-2xl px-5 py-4">
      <p className="text-[color:var(--color-text-muted)] text-xs uppercase tracking-[0.16em]">
        {label}
      </p>
      <p
        className="mt-2 font-display font-semibold text-3xl text-[color:var(--color-text-emphasis)]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </p>
    </div>
  );
}
