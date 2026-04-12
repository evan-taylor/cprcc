"use client";

import { useMutation } from "convex/react";
import posthog from "posthog-js";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import { parseNewsletterImportPaste } from "@/lib/newsletter-import";

const MAX_IMPORT_ROWS = 2000;

interface NewsletterImportPanelProps {
  isComposerBusy: boolean;
}

export function NewsletterImportPanel({
  isComposerBusy,
}: NewsletterImportPanelProps) {
  const importNewsletterSubscribers = useMutation(
    api.newsletters.importNewsletterSubscribers
  );

  const [importPasteText, setImportPasteText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const importParse = useMemo(
    () => parseNewsletterImportPaste(importPasteText),
    [importPasteText]
  );

  const runImport = async () => {
    if (importParse.entries.length === 0) {
      toast.error("Paste at least one valid email address.");
      return;
    }

    if (importParse.entries.length > MAX_IMPORT_ROWS) {
      toast.error(
        `Too many addresses at once. Import at most ${MAX_IMPORT_ROWS} rows.`
      );
      return;
    }

    setIsImporting(true);

    try {
      const result = await importNewsletterSubscribers({
        entries: importParse.entries,
      });
      const parts = [
        `${result.profileSubscribedCount} member account(s) marked subscribed`,
        `${result.externalUpsertedCount} imported contact(s) added or updated`,
      ];
      if (result.externalRemovedAsDuplicateCount > 0) {
        parts.push(
          `${result.externalRemovedAsDuplicateCount} duplicate import row(s) removed (matched member accounts)`
        );
      }
      if (result.skippedInvalidCount > 0) {
        parts.push(`${result.skippedInvalidCount} invalid row(s) skipped`);
      }
      if (result.skippedAlreadyUnsubscribedCount > 0) {
        parts.push(
          `${result.skippedAlreadyUnsubscribedCount} row(s) skipped (already unsubscribed)`
        );
      }
      toast.success("Import complete", {
        description: `${parts.join(". ")}.`,
      });
      setImportPasteText("");
      posthog.capture("newsletter_subscribers_imported", {
        duplicate_lines: importParse.duplicateLineCount,
        entries: importParse.entries.length,
        external_removed: result.externalRemovedAsDuplicateCount,
        external_upserted: result.externalUpsertedCount,
        profiles_subscribed: result.profileSubscribedCount,
        skipped_invalid: result.skippedInvalidCount,
        skipped_lines: importParse.skippedLineCount,
        skipped_opted_out: result.skippedAlreadyUnsubscribedCount,
      });
    } catch (importErr) {
      posthog.captureException(
        importErr instanceof Error
          ? importErr
          : new Error("Newsletter import failed")
      );
      if (importErr instanceof Error) {
        toast.error(importErr.message);
      } else {
        toast.error("Import failed.");
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card className="rounded-[1.75rem]">
      <CardHeader>
        <CardTitle>Import subscribers</CardTitle>
        <CardDescription>
          Paste a column of emails from Excel, or CSV rows (with or without a
          name column). We match club member accounts first; other addresses are
          stored as imported contacts and receive campaigns until they
          unsubscribe.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          helperText="Tip: In Excel, copy the email column (or name + email columns) and paste here. Commas, tabs, and semicolons are all supported."
          label="Paste from Excel or CSV"
          onChange={(event) => {
            setImportPasteText(event.target.value);
          }}
          placeholder="Paste one email per line, or name and email separated by a tab or comma."
          rows={8}
          value={importPasteText}
        />
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 text-sm">
          <p>
            <span className="font-medium text-slate-800">
              {importParse.entries.length}
            </span>{" "}
            unique email
            {importParse.entries.length === 1 ? "" : "s"} detected
            {importParse.duplicateLineCount > 0
              ? ` (${importParse.duplicateLineCount} duplicate line${
                  importParse.duplicateLineCount === 1 ? "" : "s"
                } merged)`
              : ""}
            {importParse.skippedLineCount > 0
              ? ` · ${importParse.skippedLineCount} line${
                  importParse.skippedLineCount === 1 ? "" : "s"
                } skipped (no email)`
              : ""}
          </p>
        </div>
        <Button
          disabled={
            isImporting || importParse.entries.length === 0 || isComposerBusy
          }
          onClick={async () => {
            await runImport();
          }}
          type="button"
        >
          {isImporting ? "Importing…" : "Import subscribers"}
        </Button>
      </CardContent>
    </Card>
  );
}
