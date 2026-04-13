"use client";

import Link from "next/link";
import SiteHeader from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Id } from "@/convex/_generated/dataModel";

interface MemberRow {
  _id: Id<"userProfiles">;
  email: string;
  name: string;
  newsletterStatusUpdatedAt?: number;
}

interface ImportedRow {
  _id: Id<"newsletterExternalSubscribers">;
  email: string;
  name: string;
}

export function NewsletterAudienceAccessDenied({
  onGoHome,
}: {
  onGoHome: () => void;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--color-bg)]">
      <SiteHeader />
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-bold font-display text-slate-900 text-xl">
            Access Denied
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            Only board members can manage the newsletter audience.
          </p>
          <Button className="mt-5" onClick={onGoHome} type="button">
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export function NewsletterAudienceBoardView({
  handleRemoveByEmail,
  handleRemoveImported,
  handleRemoveMember,
  hasSearchQuery,
  importedRows,
  memberRows,
  onRemoveByEmailInputChange,
  onSearchInputChange,
  removeByEmailBusy,
  removeByEmailInput,
  removingImportId,
  removingMemberId,
  searchInput,
  searchLoading,
  showSearchHint,
}: {
  handleRemoveByEmail: () => Promise<void>;
  handleRemoveImported: (
    id: Id<"newsletterExternalSubscribers">
  ) => Promise<void>;
  handleRemoveMember: (id: Id<"userProfiles">) => Promise<void>;
  hasSearchQuery: boolean;
  importedRows: ImportedRow[];
  memberRows: MemberRow[];
  onRemoveByEmailInputChange: (value: string) => void;
  onSearchInputChange: (value: string) => void;
  removeByEmailBusy: boolean;
  removeByEmailInput: string;
  removingImportId: Id<"newsletterExternalSubscribers"> | null;
  removingMemberId: Id<"userProfiles"> | null;
  searchInput: string;
  searchLoading: boolean;
  showSearchHint: boolean;
}) {
  return (
    <div className="min-h-screen bg-[color:var(--color-bg)]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-28 pb-24 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            className="text-[color:var(--color-text-muted)] text-sm hover:text-[color:var(--color-text-emphasis)]"
            href="/admin/newsletter"
          >
            ← Back to newsletter admin
          </Link>
          <p className="editorial-kicker mt-6 animate-fade-up">Admin</p>
          <h1 className="stagger-1 editorial-title mt-3 animate-fade-up text-3xl sm:text-4xl">
            Newsletter audience
          </h1>
        </div>

        <div className="space-y-8">
          <Card className="rounded-[1.75rem]">
            <CardHeader>
              <CardTitle>Remove by email</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label
                  className="mb-1.5 block font-medium text-slate-700 text-xs"
                  htmlFor="remove-by-email"
                >
                  Email address
                </label>
                <input
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 text-sm outline-none ring-slate-400/30 transition focus:border-red-400 focus:ring-2"
                  id="remove-by-email"
                  onChange={(e) => onRemoveByEmailInputChange(e.target.value)}
                  placeholder="name@example.com"
                  type="email"
                  value={removeByEmailInput}
                />
              </div>
              <Button
                className="shrink-0 sm:mb-0"
                disabled={removeByEmailBusy || !removeByEmailInput.trim()}
                onClick={async () => {
                  await handleRemoveByEmail();
                }}
                type="button"
              >
                {removeByEmailBusy ? "Removing…" : "Remove from list"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem]">
            <CardHeader>
              <CardTitle>Search subscribers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label
                  className="mb-1.5 block font-medium text-slate-700 text-xs"
                  htmlFor="audience-search"
                >
                  Search
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 text-sm outline-none ring-slate-400/30 transition focus:border-red-400 focus:ring-2"
                  id="audience-search"
                  onChange={(e) => onSearchInputChange(e.target.value)}
                  placeholder="Name or email…"
                  type="search"
                  value={searchInput}
                />
                {showSearchHint ? (
                  <p className="mt-2 text-[color:var(--color-text-muted)] text-sm">
                    Enter at least two characters to search.
                  </p>
                ) : null}
              </div>

              <NewsletterAudienceSearchSection
                handleRemoveImported={handleRemoveImported}
                handleRemoveMember={handleRemoveMember}
                hasSearchQuery={hasSearchQuery}
                importedRows={importedRows}
                memberRows={memberRows}
                removingImportId={removingImportId}
                removingMemberId={removingMemberId}
                searchLoading={searchLoading}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function NewsletterAudienceSearchSection({
  handleRemoveImported,
  handleRemoveMember,
  hasSearchQuery,
  importedRows,
  memberRows,
  removingImportId,
  removingMemberId,
  searchLoading,
}: {
  handleRemoveImported: (
    id: Id<"newsletterExternalSubscribers">
  ) => Promise<void>;
  handleRemoveMember: (id: Id<"userProfiles">) => Promise<void>;
  hasSearchQuery: boolean;
  importedRows: ImportedRow[];
  memberRows: MemberRow[];
  removingImportId: Id<"newsletterExternalSubscribers"> | null;
  removingMemberId: Id<"userProfiles"> | null;
  searchLoading: boolean;
}) {
  if (!hasSearchQuery) {
    return (
      <p className="text-[color:var(--color-text-muted)] text-sm">
        Start typing to search the full audience.
      </p>
    );
  }

  if (searchLoading) {
    return (
      <p
        aria-live="polite"
        className="text-[color:var(--color-text-muted)] text-sm"
      >
        Searching…
      </p>
    );
  }

  return (
    <NewsletterAudienceSearchResults
      handleRemoveImported={handleRemoveImported}
      handleRemoveMember={handleRemoveMember}
      importedRows={importedRows}
      memberRows={memberRows}
      removingImportId={removingImportId}
      removingMemberId={removingMemberId}
    />
  );
}

function NewsletterAudienceSearchResults({
  handleRemoveImported,
  handleRemoveMember,
  importedRows,
  memberRows,
  removingImportId,
  removingMemberId,
}: {
  handleRemoveImported: (
    id: Id<"newsletterExternalSubscribers">
  ) => Promise<void>;
  handleRemoveMember: (id: Id<"userProfiles">) => Promise<void>;
  importedRows: ImportedRow[];
  memberRows: MemberRow[];
  removingImportId: Id<"newsletterExternalSubscribers"> | null;
  removingMemberId: Id<"userProfiles"> | null;
}) {
  return (
    <div className="space-y-8">
      <section>
        <p className="mb-3 font-medium text-slate-700 text-xs uppercase tracking-wide">
          Member accounts ({memberRows.length}
          {memberRows.length >= 40 ? "+" : ""})
        </p>
        <div className="space-y-3">
          {memberRows.length ? (
            memberRows.map((member) => (
              <div
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
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
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge variant="success">Subscribed</Badge>
                  <Button
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    disabled={removingMemberId === member._id}
                    onClick={async () => {
                      await handleRemoveMember(member._id);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    {removingMemberId === member._id
                      ? "Removing…"
                      : "Unsubscribe"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[color:var(--color-text-muted)] text-sm">
              No subscribed members match that search.
            </p>
          )}
        </div>
      </section>

      <section>
        <p className="mb-3 font-medium text-slate-700 text-xs uppercase tracking-wide">
          Imported contacts ({importedRows.length}
          {importedRows.length >= 40 ? "+" : ""})
        </p>
        <div className="space-y-3">
          {importedRows.length ? (
            importedRows.map((row) => (
              <div
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                key={row._id}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900 text-sm">
                    {row.name}
                  </p>
                  <p className="truncate text-slate-500 text-xs">{row.email}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge variant="success">Imported</Badge>
                  <Button
                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    disabled={removingImportId === row._id}
                    onClick={async () => {
                      await handleRemoveImported(row._id);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    {removingImportId === row._id ? "Removing…" : "Remove"}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[color:var(--color-text-muted)] text-sm">
              No imported contacts match that search.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
