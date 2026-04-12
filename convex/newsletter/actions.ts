"use node";

import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, action } from "../_generated/server";
import {
  generateNewsletterEmailHtml,
  generateNewsletterEmailText,
} from "../emails/newsletter_email";
import {
  CLUB_EMAIL_FROM,
  CLUB_EMAIL_REPLY_TO,
  createPlainTextFromHtml,
  sanitizeEmailHtml,
} from "../lib/email";
import { getNewsletterUnsubscribeUrl } from "../lib/newsletters";
import { resend } from "../resend";

const SEND_BATCH_SIZE = 10;
const MAX_FAILURE_EXAMPLES = 5;

interface Recipient {
  email: string;
  name: string;
  newsletterUnsubscribeToken: string;
  userProfileId: Id<"userProfiles">;
}

function getFailureMessage(failedEmails: string[], fallbackMessage?: string) {
  if (failedEmails.length === 0) {
    return fallbackMessage;
  }

  const examples = failedEmails.slice(0, MAX_FAILURE_EXAMPLES).join(", ");
  if (failedEmails.length <= MAX_FAILURE_EXAMPLES) {
    return `Failed to send to: ${examples}`;
  }

  return `Failed to send to: ${examples}, and ${failedEmails.length - MAX_FAILURE_EXAMPLES} more`;
}

async function sendOneNewsletterEmail(
  ctx: ActionCtx,
  recipient: Recipient,
  htmlContent: string,
  previewText: string | undefined,
  subject: string
): Promise<{ email: string; success: boolean }> {
  const unsubscribeUrl = getNewsletterUnsubscribeUrl(
    recipient.newsletterUnsubscribeToken
  );

  try {
    await resend.sendEmail(ctx, {
      from: CLUB_EMAIL_FROM,
      to: [recipient.email],
      replyTo: [CLUB_EMAIL_REPLY_TO],
      subject,
      html: generateNewsletterEmailHtml({
        bodyHtml: htmlContent,
        previewText,
        subject,
        unsubscribeUrl,
      }),
      text: generateNewsletterEmailText({
        bodyHtml: htmlContent,
        previewText,
        subject,
        unsubscribeUrl,
      }),
    });

    return { email: recipient.email, success: true };
  } catch (_error) {
    return { email: recipient.email, success: false };
  }
}

async function sendNewsletterBatches(
  ctx: ActionCtx,
  recipients: Recipient[],
  htmlContent: string,
  previewText: string | undefined,
  subject: string
): Promise<{
  failedCount: number;
  failedEmails: string[];
  sentCount: number;
}> {
  let sentCount = 0;
  let failedCount = 0;
  const failedEmails: string[] = [];

  for (
    let recipientIndex = 0;
    recipientIndex < recipients.length;
    recipientIndex += SEND_BATCH_SIZE
  ) {
    const batch = recipients.slice(
      recipientIndex,
      recipientIndex + SEND_BATCH_SIZE
    );

    const batchResults = await Promise.all(
      batch.map((recipient) =>
        sendOneNewsletterEmail(
          ctx,
          recipient,
          htmlContent,
          previewText,
          subject
        )
      )
    );

    for (const batchResult of batchResults) {
      if (batchResult.success) {
        sentCount += 1;
      } else {
        failedCount += 1;
        failedEmails.push(batchResult.email);
      }
    }
  }

  return { failedCount, failedEmails, sentCount };
}

export const sendNewsletterCampaign = action({
  args: {
    htmlContent: v.string(),
    previewText: v.optional(v.string()),
    subject: v.string(),
  },
  returns: v.object({
    campaignId: v.id("newsletterCampaigns"),
    failedCount: v.number(),
    recipientCount: v.number(),
    sentCount: v.number(),
    status: v.union(v.literal("sent"), v.literal("failed")),
  }),
  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(api.users.getCurrentUser, {});
    if (!currentUser || currentUser.role !== "board") {
      throw new Error("Only board members can send newsletter campaigns");
    }

    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const subject = args.subject.trim();
    const previewText = args.previewText?.trim() || undefined;
    const htmlContent = sanitizeEmailHtml(args.htmlContent);
    const plainTextContent = createPlainTextFromHtml(htmlContent);

    if (subject.length === 0) {
      throw new Error("Newsletter subject is required");
    }

    if (plainTextContent.length === 0) {
      throw new Error("Newsletter content cannot be empty");
    }

    const recipients: Recipient[] = await ctx.runQuery(
      internal.newsletters.getSubscribedRecipientsForSend,
      {}
    );

    if (recipients.length === 0) {
      throw new Error("There are no subscribed members to email");
    }

    const campaignId: Id<"newsletterCampaigns"> = await ctx.runMutation(
      internal.newsletters.createNewsletterCampaignRecord,
      {
        createdBy: currentUser._id,
        htmlContent,
        plainTextContent,
        previewText,
        recipientCount: recipients.length,
        subject,
      }
    );

    let sentCount = 0;
    let failedCount = 0;
    let failedEmails: string[] = [];

    try {
      const batchResult = await sendNewsletterBatches(
        ctx,
        recipients,
        htmlContent,
        previewText,
        subject
      );
      sentCount = batchResult.sentCount;
      failedCount = batchResult.failedCount;
      failedEmails = batchResult.failedEmails;
    } catch (error) {
      const failurePrefix =
        error instanceof Error ? error.message : "Failed to send newsletter";
      const bounceDetails = getFailureMessage(failedEmails);
      const failureMessage = bounceDetails
        ? `${failurePrefix}. ${bounceDetails}`
        : failurePrefix;
      await ctx.runMutation(
        internal.newsletters.finalizeNewsletterCampaignRecord,
        {
          campaignId,
          failedCount,
          failureMessage,
          sentAt: sentCount > 0 ? Date.now() : undefined,
          sentCount,
          status: sentCount > 0 ? "sent" : "failed",
        }
      );
      throw error;
    }

    const status: "sent" | "failed" = sentCount > 0 ? "sent" : "failed";
    await ctx.runMutation(
      internal.newsletters.finalizeNewsletterCampaignRecord,
      {
        campaignId,
        failedCount,
        failureMessage: getFailureMessage(failedEmails),
        sentAt: sentCount > 0 ? Date.now() : undefined,
        sentCount,
        status,
      }
    );

    if (sentCount === 0) {
      throw new Error(
        getFailureMessage(failedEmails, "Failed to send newsletter")
      );
    }

    return {
      campaignId,
      failedCount,
      recipientCount: recipients.length,
      sentCount,
      status,
    };
  },
});
