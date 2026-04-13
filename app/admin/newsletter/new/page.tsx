"use client";

import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { NewsletterEditor } from "@/components/newsletter-editor";
import SiteHeader from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/page-loader";
import { api } from "@/convex/_generated/api";
import { repairVisualEditorHtmlIfMarkdown } from "@/lib/newsletter-markdown";

const initialEditorContent =
  "<h2>What’s new with Cal Poly Red Cross Club</h2><p>Share your latest updates, volunteer opportunities, and reminders here.</p><ul><li>Upcoming events and meeting details</li><li>Volunteer opportunities and trainings</li><li>Important club announcements</li></ul><p>Thank you for being part of our chapter.</p>";

export default function AdminNewsletterNewPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const ensureCurrentUserProfile = useMutation(
    api.users.ensureCurrentUserProfile
  );
  const sendNewsletterCampaign = useAction(
    api.newsletter.actions.sendNewsletterCampaign
  );
  const [profileEnsured, setProfileEnsured] = useState(false);
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [htmlContent, setHtmlContent] = useState(initialEditorContent);
  const [subjectError, setSubjectError] = useState<string | undefined>();
  const [editorError, setEditorError] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);

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

  const validateForm = () => {
    const trimmedSubject = subject.trim();
    const trimmedContent = htmlContent.replace(/<[^>]+>/g, "").trim();

    let valid = true;

    if (trimmedSubject.length === 0) {
      setSubjectError("Add a subject line before sending.");
      valid = false;
    } else {
      setSubjectError(undefined);
    }

    if (trimmedContent.length === 0) {
      setEditorError("Write some newsletter content before sending.");
      valid = false;
    } else {
      setEditorError(undefined);
    }

    return valid;
  };

  const handleSend = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSending(true);

    try {
      const result = await sendNewsletterCampaign({
        htmlContent: repairVisualEditorHtmlIfMarkdown(htmlContent),
        previewText: previewText.trim() || undefined,
        subject: subject.trim(),
      });

      if (result.failedCount > 0) {
        toast.warning(
          `Sent ${result.sentCount} of ${result.recipientCount} emails`,
          {
            description: `${result.failedCount} failed to send.`,
          }
        );
      } else {
        toast.success(
          `Sent ${result.sentCount} email${result.sentCount === 1 ? "" : "s"}.`
        );
      }
      posthog.capture("newsletter_campaign_sent", {
        failed_count: result.failedCount,
        recipient_count: result.recipientCount,
        sent_count: result.sentCount,
      });
    } catch (sendError) {
      posthog.captureException(
        sendError instanceof Error
          ? sendError
          : new Error("Newsletter send failed")
      );
      if (sendError instanceof Error) {
        toast.error(sendError.message);
      } else {
        toast.error("Failed to send newsletter.");
      }
    } finally {
      setIsSending(false);
    }
  };

  if (authLoading || currentUser === undefined) {
    return <PageLoader message="Loading…" />;
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
            <h1 className="font-bold font-display text-slate-900 text-xl">
              Access Denied
            </h1>
            <p className="mt-2 text-slate-500 text-sm">
              Only board members can compose newsletters.
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
    <div className="flex min-h-screen flex-col bg-[color:var(--color-bg)]">
      <SiteHeader />
      <div className="flex min-h-0 flex-1 flex-col pt-[4.5rem]">
        <header className="shrink-0 border-[color:var(--color-border)]/80 border-b bg-[color:var(--color-bg)]/90 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-[min(100%,88rem)] flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link
                className="text-[color:var(--color-text-muted)] text-sm transition-colors hover:text-red-600"
                href="/admin/newsletter"
              >
                ← Newsletter
              </Link>
              <h1 className="mt-2 font-display font-semibold text-2xl text-[color:var(--color-text-emphasis)] sm:text-3xl">
                New newsletter
              </h1>
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-[min(100%,88rem)] flex-col gap-6 pb-8">
            <div className="grid gap-5 lg:grid-cols-2">
              <Input
                error={subjectError}
                label="Subject"
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Volunteer updates for this week"
                value={subject}
              />
              <Textarea
                helperText="Shown as preview text in inboxes that support it."
                label="Preview text"
                onChange={(event) => setPreviewText(event.target.value)}
                placeholder="A quick summary of this week’s highlights."
                value={previewText}
              />
            </div>
            <div>
              <p className="mb-2 block font-medium text-slate-900 text-sm">
                Body
              </p>
              <NewsletterEditor
                content={htmlContent}
                disabled={isSending}
                error={editorError}
                largeWorkspace
                onChange={setHtmlContent}
              />
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-[color:var(--color-border)]/80 border-t bg-[color:var(--color-bg-subtle)]/90 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-10">
          <div className="mx-auto flex w-full max-w-[min(100%,88rem)] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[color:var(--color-text-muted)] text-sm">
              Replies go to RedCrossClub@calpoly.edu and every email includes an
              unsubscribe link.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={isSending}
                onClick={handleSend}
                size="md"
                type="button"
              >
                {isSending ? "Sending…" : "Send newsletter"}
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
