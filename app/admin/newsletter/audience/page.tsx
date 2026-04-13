"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  NewsletterAudienceAccessDenied,
  NewsletterAudienceBoardView,
} from "@/components/newsletter-audience-manager";
import { PageLoader } from "@/components/ui/page-loader";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const SEARCH_DEBOUNCE_MS = 320;

export default function AdminNewsletterAudiencePage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const ensureCurrentUserProfile = useMutation(
    api.users.ensureCurrentUserProfile
  );
  const adminUnsubscribeMemberFromNewsletter = useMutation(
    api.newsletters.adminUnsubscribeMemberFromNewsletter
  );
  const adminRemoveImportedNewsletterSubscriber = useMutation(
    api.newsletters.adminRemoveImportedNewsletterSubscriber
  );
  const adminRemoveSubscriberByEmail = useMutation(
    api.newsletters.adminRemoveSubscriberByEmail
  );

  const [profileEnsured, setProfileEnsured] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [removingMemberId, setRemovingMemberId] =
    useState<Id<"userProfiles"> | null>(null);
  const [removingImportId, setRemovingImportId] =
    useState<Id<"newsletterExternalSubscribers"> | null>(null);
  const [removeByEmailInput, setRemoveByEmailInput] = useState("");
  const [removeByEmailBusy, setRemoveByEmailBusy] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [searchInput]);

  const searchResults = useQuery(
    api.newsletters.searchNewsletterAudience,
    isAuthenticated &&
      currentUser?.role === "board" &&
      debouncedSearch.length >= 2
      ? { search: debouncedSearch }
      : "skip"
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
  }, [currentUser, ensureCurrentUserProfile, profileEnsured]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || currentUser === null) {
      router.push("/signin");
    }
  }, [authLoading, currentUser, isAuthenticated, router]);

  const handleRemoveMember = async (userProfileId: Id<"userProfiles">) => {
    setRemovingMemberId(userProfileId);
    try {
      const result = await adminUnsubscribeMemberFromNewsletter({
        userProfileId,
      });
      toast.success(`Unsubscribed ${result.email} from the newsletter.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not update subscription.";
      toast.error(message);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleRemoveImported = async (
    externalSubscriberId: Id<"newsletterExternalSubscribers">
  ) => {
    setRemovingImportId(externalSubscriberId);
    try {
      const result = await adminRemoveImportedNewsletterSubscriber({
        externalSubscriberId,
      });
      toast.success(`Removed ${result.email} from imported contacts.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not remove contact.";
      toast.error(message);
    } finally {
      setRemovingImportId(null);
    }
  };

  const handleRemoveByEmail = async () => {
    setRemoveByEmailBusy(true);
    try {
      const result = await adminRemoveSubscriberByEmail({
        email: removeByEmailInput,
      });
      if (result.outcome === "member_unsubscribed") {
        toast.success(`Unsubscribed ${result.email} from the newsletter.`);
      } else {
        toast.success(`Removed ${result.email} from imported contacts.`);
      }
      setRemoveByEmailInput("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not remove that address.";
      toast.error(message);
    } finally {
      setRemoveByEmailBusy(false);
    }
  };

  if (authLoading || currentUser === undefined) {
    return <PageLoader message="Loading…" />;
  }

  if (!isAuthenticated || currentUser === null) {
    return null;
  }

  if (currentUser.role !== "board") {
    return <NewsletterAudienceAccessDenied onGoHome={() => router.push("/")} />;
  }

  const showSearchHint =
    debouncedSearch.length > 0 && debouncedSearch.length < 2;
  const hasSearchQuery = debouncedSearch.length >= 2;
  const searchLoading = hasSearchQuery && searchResults === undefined;
  const memberRows = searchResults?.members ?? [];
  const importedRows = searchResults?.imported ?? [];

  return (
    <NewsletterAudienceBoardView
      handleRemoveByEmail={handleRemoveByEmail}
      handleRemoveImported={handleRemoveImported}
      handleRemoveMember={handleRemoveMember}
      hasSearchQuery={hasSearchQuery}
      importedRows={importedRows}
      memberRows={memberRows}
      onRemoveByEmailInputChange={setRemoveByEmailInput}
      onSearchInputChange={setSearchInput}
      removeByEmailBusy={removeByEmailBusy}
      removeByEmailInput={removeByEmailInput}
      removingImportId={removingImportId}
      removingMemberId={removingMemberId}
      searchInput={searchInput}
      searchLoading={searchLoading}
      showSearchHint={showSearchHint}
    />
  );
}
