"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/site-header";
import { PageLoader } from "@/components/ui/page-loader";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export default function AdminPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser);
  const promoteToBoard = useMutation(api.users.promoteToBoard);
  const ensureCurrentUserProfile = useMutation(
    api.users.ensureCurrentUserProfile
  );
  const [promoting, setPromoting] = useState<Id<"userProfiles"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileEnsured, setProfileEnsured] = useState(false);
  const router = useRouter();

  const shouldFetchUsers =
    isAuthenticated && currentUser && currentUser.role === "board";

  const allUsers = useQuery(
    api.users.listAllUsers,
    shouldFetchUsers ? {} : "skip"
  );

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
  }, [currentUser, profileEnsured, ensureCurrentUserProfile]);

  useEffect(() => {
    if (!isAuthenticated || currentUser === null) {
      router.push("/signin");
    }
  }, [isAuthenticated, currentUser, router]);

  if (
    authLoading ||
    currentUser === undefined ||
    (shouldFetchUsers && allUsers === undefined)
  ) {
    return (
      <PageLoader
        detail="Loading board members and role permissions."
        message="Loading admin tools..."
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
              Only board members can access this page.
            </p>
            <button
              className="mt-5 inline-flex h-10 items-center rounded-full bg-red-600 px-6 font-semibold text-sm text-white shadow-md shadow-red-600/20 transition-all duration-200 hover:bg-red-700 active:scale-[0.97]"
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

  const handlePromote = async (profileId: Id<"userProfiles">) => {
    setPromoting(profileId);
    setError(null);
    try {
      await promoteToBoard({ profileId });
      const promotedUser = allUsers?.find((u) => u._id === profileId);
      posthog.capture("user_promoted_to_board", {
        promoted_user_id: profileId,
        promoted_user_name: promotedUser?.name,
      });
    } catch (err) {
      posthog.captureException(
        err instanceof Error ? err : new Error("Promotion failed")
      );
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to promote user");
      }
    } finally {
      setPromoting(null);
    }
  };

  type UserProfile = NonNullable<typeof allUsers>[number];
  const members =
    allUsers?.filter((user: UserProfile) => user.role === "member") ?? [];
  const boardMembers =
    allUsers?.filter((user: UserProfile) => user.role === "board") ?? [];

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="editorial-kicker animate-fade-up">Admin</p>
          <h1 className="stagger-1 editorial-title mt-3 animate-fade-up text-3xl sm:text-4xl">
            User Management
          </h1>
          <p className="stagger-2 mt-2 animate-fade-up text-[color:var(--color-text-muted)]">
            Manage user roles and permissions for the Cal Poly Red Cross Club
          </p>
        </header>

        {error && (
          <div className="mb-6 animate-scale-in rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-10">
          <UserSection
            badge="Board"
            badgeClasses="bg-red-50 text-red-700"
            countLabel={`${boardMembers.length} ${boardMembers.length === 1 ? "member" : "members"}`}
            currentUserId={currentUser._id}
            title="Board Members"
            users={boardMembers}
          />

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-slate-900">
                Members
              </h2>
              <span
                className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 text-xs"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
            </div>
            <div className="editorial-card overflow-hidden rounded-xl">
              {/* Desktop table */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <th
                        className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider"
                        scope="col"
                      >
                        Name
                      </th>
                      <th
                        className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider"
                        scope="col"
                      >
                        Email
                      </th>
                      <th
                        className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider"
                        scope="col"
                      >
                        Role
                      </th>
                      <th
                        className="px-5 py-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider"
                        scope="col"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {members.length === 0 ? (
                      <tr>
                        <td
                          className="px-5 py-10 text-center text-slate-400 text-sm"
                          colSpan={4}
                        >
                          No members found
                        </td>
                      </tr>
                    ) : (
                      members.map((user: UserProfile) => (
                        <tr
                          className="transition-colors duration-100 hover:bg-slate-50/50"
                          key={user._id}
                        >
                          <td className="px-5 py-3.5 text-slate-900 text-sm">
                            {user.name}
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-sm">
                            {user.email}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600 text-xs">
                              Member
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white text-xs shadow-sm transition-all duration-200 hover:bg-red-700 hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={promoting === user._id}
                              onClick={() => handlePromote(user._id)}
                              type="button"
                            >
                              {promoting === user._id
                                ? "Promoting…"
                                : "Promote to Board"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile card view */}
              <div className="divide-y divide-slate-100 sm:hidden">
                {members.length === 0 ? (
                  <div className="bg-white px-5 py-10 text-center text-slate-400 text-sm">
                    No members found
                  </div>
                ) : (
                  members.map((user: UserProfile) => (
                    <div className="bg-white p-4" key={`mobile-${user._id}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900 text-sm">
                            {user.name}
                          </p>
                          <p className="mt-0.5 truncate text-slate-500 text-xs">
                            {user.email}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600 text-xs">
                          Member
                        </span>
                      </div>
                      <button
                        className="mt-3 w-full rounded-lg bg-red-600 px-4 py-2 font-semibold text-white text-xs shadow-sm transition-all duration-200 hover:bg-red-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={promoting === user._id}
                        onClick={() => handlePromote(user._id)}
                        type="button"
                      >
                        {promoting === user._id
                          ? "Promoting…"
                          : "Promote to Board"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

interface UserData {
  _id: Id<"userProfiles">;
  email: string;
  name: string;
  role: string;
}

function UserSection({
  title,
  countLabel,
  badge,
  badgeClasses,
  users,
  currentUserId,
}: {
  title: string;
  countLabel: string;
  badge: string;
  badgeClasses: string;
  users: UserData[];
  currentUserId: Id<"userProfiles">;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display font-semibold text-lg text-slate-900">
          {title}
        </h2>
        <span
          className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-600 text-xs"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {countLabel}
        </span>
      </div>
      <div className="editorial-card overflow-hidden rounded-xl">
        {/* Desktop table */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead className="bg-slate-50/80">
              <tr>
                <th
                  className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider"
                  scope="col"
                >
                  Name
                </th>
                <th
                  className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider"
                  scope="col"
                >
                  Email
                </th>
                <th
                  className="px-5 py-3 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider"
                  scope="col"
                >
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td
                    className="px-5 py-10 text-center text-slate-400 text-sm"
                    colSpan={3}
                  >
                    No {title.toLowerCase()} found
                  </td>
                </tr>
              ) : (
                users.map((user: UserData) => (
                  <tr
                    className="transition-colors duration-100 hover:bg-slate-50/50"
                    key={user._id}
                  >
                    <td className="px-5 py-3.5 text-slate-900 text-sm">
                      {user.name}
                      {user._id === currentUserId && (
                        <span className="ml-2 text-slate-400 text-xs">
                          (You)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-sm">
                      {user.email}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs ${badgeClasses}`}
                      >
                        {badge}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="divide-y divide-slate-100 sm:hidden">
          {users.length === 0 ? (
            <div className="bg-white px-5 py-10 text-center text-slate-400 text-sm">
              No {title.toLowerCase()} found
            </div>
          ) : (
            users.map((user: UserData) => (
              <div className="bg-white p-4" key={`mobile-${user._id}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 text-sm">
                      {user.name}
                      {user._id === currentUserId && (
                        <span className="ml-1.5 text-slate-400 text-xs">
                          (You)
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 truncate text-slate-500 text-xs">
                      {user.email}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 font-medium text-xs ${badgeClasses}`}
                  >
                    {badge}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
