"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/site-header";
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
    if (currentUser === undefined) {
      return;
    }
    if (currentUser === null) {
      return;
    }
    if (profileEnsured) {
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || currentUser === null) {
    return null;
  }

  if (currentUser.role !== "board") {
    return (
      <div className="min-h-screen bg-white">
        <SiteHeader />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
          <div className="text-center">
            <h1 className="font-bold text-2xl text-slate-900">Access Denied</h1>
            <p className="mt-2 text-slate-600">
              Only board members can access this page.
            </p>
            <button
              className="mt-4 rounded-lg bg-rose-600 px-6 py-2 font-semibold text-white hover:bg-rose-700"
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
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to promote user");
      }
    } finally {
      setPromoting(null);
    }
  };

  const members = allUsers?.filter((user) => user.role === "member") ?? [];
  const boardMembers = allUsers?.filter((user) => user.role === "board") ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-24">
        <div className="mb-8">
          <h1 className="font-bold text-3xl text-slate-900">User Management</h1>
          <p className="mt-2 text-slate-600">
            Manage user roles and permissions for the Cal Poly Red Cross Club
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-8">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-xl">
                Board Members
              </h2>
              <span className="rounded-full bg-rose-100 px-3 py-1 font-medium text-rose-700 text-sm">
                {boardMembers.length}{" "}
                {boardMembers.length === 1 ? "member" : "members"}
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 text-sm">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 text-sm">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 text-sm">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {boardMembers.length === 0 ? (
                    <tr>
                      <td
                        className="px-6 py-8 text-center text-slate-500"
                        colSpan={3}
                      >
                        No board members found
                      </td>
                    </tr>
                  ) : (
                    boardMembers.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 text-slate-900">
                          {user.name}
                          {user._id === currentUser._id && (
                            <span className="ml-2 text-slate-500 text-xs">
                              (You)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 font-medium text-rose-700 text-xs">
                            Board
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 text-xl">Members</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 text-sm">
                {members.length} {members.length === 1 ? "member" : "members"}
              </span>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 text-sm">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 text-sm">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left font-semibold text-slate-700 text-sm">
                      Role
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-slate-700 text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {members.length === 0 ? (
                    <tr>
                      <td
                        className="px-6 py-8 text-center text-slate-500"
                        colSpan={4}
                      >
                        No members found
                      </td>
                    </tr>
                  ) : (
                    members.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 text-slate-900">
                          {user.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700 text-xs">
                            Member
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className="rounded-lg bg-rose-600 px-4 py-2 font-medium text-sm text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={promoting === user._id}
                            onClick={() => handlePromote(user._id)}
                            type="button"
                          >
                            {promoting === user._id
                              ? "Promoting..."
                              : "Promote to Board"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
