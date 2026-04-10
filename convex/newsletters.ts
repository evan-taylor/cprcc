import { vOnEmailEventArgs, type EmailEvent } from "@convex-dev/resend";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  type MutationCtx,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import {
  getCurrentUserProfile,
  requireAuth,
  requireBoardMember,
} from "./lib/auth";
import {
  createNewsletterUnsubscribeToken,
  getResolvedNewsletterStatus,
  NEWSLETTER_SUBSCRIBED,
  NEWSLETTER_UNSUBSCRIBED,
  resolveNewsletterStatus,
} from "./lib/newsletters";

export const getNewsletterSettings = query({
  args: {},
  returns: v.union(
    v.object({
      email: v.string(),
      name: v.string(),
      newsletterStatus: v.union(
        v.literal("subscribed"),
        v.literal("unsubscribed")
      ),
      newsletterStatusUpdatedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const userProfile = await getCurrentUserProfile(ctx);
    if (!userProfile) {
      return null;
    }

    return {
      email: userProfile.email,
      name: userProfile.name,
      newsletterStatus: getResolvedNewsletterStatus(
        userProfile.newsletterStatus
      ),
      newsletterStatusUpdatedAt: userProfile.newsletterStatusUpdatedAt,
    };
  },
});

export const setCurrentUserNewsletterSubscription = mutation({
  args: {
    subscribed: v.boolean(),
  },
  returns: v.object({
    email: v.string(),
    newsletterStatus: v.union(
      v.literal("subscribed"),
      v.literal("unsubscribed")
    ),
    newsletterStatusUpdatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const userProfile = await requireAuth(ctx);
    const newsletterStatus = resolveNewsletterStatus(args.subscribed);
    const newsletterStatusUpdatedAt = Date.now();

    await ctx.db.patch(userProfile._id, {
      newsletterStatus,
      newsletterStatusUpdatedAt,
      newsletterUnsubscribeToken:
        userProfile.newsletterUnsubscribeToken ??
        createNewsletterUnsubscribeToken(),
    });

    return {
      email: userProfile.email,
      newsletterStatus,
      newsletterStatusUpdatedAt,
    };
  },
});

const normalizeEmailAddress = (value: string) => value.trim().toLowerCase();

async function findProfilesByEmailAddress(
  ctx: MutationCtx,
  email: string
) {
  const normalizedEmail = normalizeEmailAddress(email);

  const exactMatches = await ctx.db
    .query("userProfiles")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();

  if (normalizedEmail === email) {
    return exactMatches;
  }

  const normalizedMatches = await ctx.db
    .query("userProfiles")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .collect();

  if (exactMatches.length > 0 || normalizedMatches.length > 0) {
    const uniqueProfiles = new Map<string, Doc<"userProfiles">>();
    for (const profile of [...exactMatches, ...normalizedMatches]) {
      uniqueProfiles.set(profile._id, profile);
    }
    return [...uniqueProfiles.values()];
  }

  const allProfiles = await ctx.db.query("userProfiles").collect();
  return allProfiles.filter(
    (profile) => normalizeEmailAddress(profile.email) === normalizedEmail
  );
}

async function unsubscribeProfilesForBounce(
  ctx: MutationCtx,
  bouncedEmail: string
) {
  const matchingProfiles = await findProfilesByEmailAddress(ctx, bouncedEmail);
  if (matchingProfiles.length === 0) {
    return 0;
  }

  const newsletterStatusUpdatedAt = Date.now();
  let unsubscribedProfiles = 0;

  for (const profile of matchingProfiles) {
    if (profile.newsletterStatus === NEWSLETTER_UNSUBSCRIBED) {
      continue;
    }

    await ctx.db.patch(profile._id, {
      newsletterStatus: NEWSLETTER_UNSUBSCRIBED,
      newsletterStatusUpdatedAt,
      newsletterUnsubscribeToken:
        profile.newsletterUnsubscribeToken ??
        createNewsletterUnsubscribeToken(),
    });
    unsubscribedProfiles += 1;
  }

  return unsubscribedProfiles;
}

function getEventRecipientEmails(event: EmailEvent) {
  const recipients = event.data.to;
  return Array.isArray(recipients) ? recipients : [recipients];
}

export const handleResendEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.event.type !== "email.bounced") {
      return null;
    }

    const recipients = getEventRecipientEmails(args.event);
    for (const recipient of recipients) {
      await unsubscribeProfilesForBounce(ctx, recipient);
    }

    return null;
  },
});

export const getPublicSubscriptionByToken = query({
  args: {
    token: v.string(),
  },
  returns: v.union(
    v.object({
      email: v.string(),
      name: v.string(),
      newsletterStatus: v.union(
        v.literal("subscribed"),
        v.literal("unsubscribed")
      ),
      newsletterStatusUpdatedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_newsletter_unsubscribe_token", (q) =>
        q.eq("newsletterUnsubscribeToken", args.token)
      )
      .unique();

    if (!userProfile) {
      return null;
    }

    return {
      email: userProfile.email,
      name: userProfile.name,
      newsletterStatus: getResolvedNewsletterStatus(
        userProfile.newsletterStatus
      ),
      newsletterStatusUpdatedAt: userProfile.newsletterStatusUpdatedAt,
    };
  },
});

export const unsubscribeFromNewsletterByToken = mutation({
  args: {
    token: v.string(),
  },
  returns: v.object({
    email: v.string(),
    newsletterStatus: v.literal("unsubscribed"),
    newsletterStatusUpdatedAt: v.number(),
  }),
  handler: async (ctx, args) => {
    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_newsletter_unsubscribe_token", (q) =>
        q.eq("newsletterUnsubscribeToken", args.token)
      )
      .unique();

    if (!userProfile) {
      throw new Error("Invalid unsubscribe link");
    }

    const newsletterStatusUpdatedAt = Date.now();
    await ctx.db.patch(userProfile._id, {
      newsletterStatus: NEWSLETTER_UNSUBSCRIBED,
      newsletterStatusUpdatedAt,
      newsletterUnsubscribeToken:
        userProfile.newsletterUnsubscribeToken ??
        createNewsletterUnsubscribeToken(),
    });

    return {
      email: userProfile.email,
      newsletterStatus: NEWSLETTER_UNSUBSCRIBED,
      newsletterStatusUpdatedAt,
    };
  },
});

export const getNewsletterAdminOverview = query({
  args: {},
  returns: v.object({
    recentCampaigns: v.array(
      v.object({
        _id: v.id("newsletterCampaigns"),
        createdAt: v.number(),
        createdByName: v.string(),
        failedCount: v.number(),
        previewText: v.optional(v.string()),
        recipientCount: v.number(),
        sentAt: v.optional(v.number()),
        sentCount: v.number(),
        status: v.union(
          v.literal("sending"),
          v.literal("sent"),
          v.literal("failed")
        ),
        subject: v.string(),
      })
    ),
    subscribedMembersCount: v.number(),
    subscribedMembersPreview: v.array(
      v.object({
        _id: v.id("userProfiles"),
        email: v.string(),
        name: v.string(),
        newsletterStatusUpdatedAt: v.optional(v.number()),
      })
    ),
    totalMembersCount: v.number(),
    unsubscribedMembersCount: v.number(),
  }),
  handler: async (ctx) => {
    await requireBoardMember(ctx);

    const [allProfiles, subscribedProfiles, campaigns] = await Promise.all([
      ctx.db.query("userProfiles").collect(),
      ctx.db
        .query("userProfiles")
        .withIndex("by_newsletter_status", (q) =>
          q.eq("newsletterStatus", NEWSLETTER_SUBSCRIBED)
        )
        .collect(),
      ctx.db.query("newsletterCampaigns").collect(),
    ]);

    const profileNameById = new Map(
      allProfiles.map((profile) => [profile._id, profile.name])
    );

    const recentCampaigns = [...campaigns]
      .sort(
        (left, right) =>
          (right.sentAt ?? right.updatedAt) - (left.sentAt ?? left.updatedAt)
      )
      .slice(0, 6)
      .map((campaign) => ({
        _id: campaign._id,
        createdAt: campaign.createdAt,
        createdByName:
          profileNameById.get(campaign.createdBy) ?? "Board member",
        failedCount: campaign.failedCount,
        previewText: campaign.previewText,
        recipientCount: campaign.recipientCount,
        sentAt: campaign.sentAt,
        sentCount: campaign.sentCount,
        status: campaign.status,
        subject: campaign.subject,
      }));

    const subscribedMembersPreview = [...subscribedProfiles]
      .sort((left, right) => left.name.localeCompare(right.name))
      .slice(0, 8)
      .map((profile) => ({
        _id: profile._id,
        email: profile.email,
        name: profile.name,
        newsletterStatusUpdatedAt: profile.newsletterStatusUpdatedAt,
      }));

    return {
      recentCampaigns,
      subscribedMembersCount: subscribedProfiles.length,
      subscribedMembersPreview,
      totalMembersCount: allProfiles.length,
      unsubscribedMembersCount: allProfiles.length - subscribedProfiles.length,
    };
  },
});

export const getSubscribedRecipientsForSend = internalQuery({
  args: {},
  handler: async (ctx) => {
    const subscribedProfiles = await ctx.db
      .query("userProfiles")
      .withIndex("by_newsletter_status", (q) =>
        q.eq("newsletterStatus", NEWSLETTER_SUBSCRIBED)
      )
      .collect();

    return subscribedProfiles
      .filter((profile) => !!profile.newsletterUnsubscribeToken)
      .map((profile) => ({
        email: profile.email,
        name: profile.name,
        newsletterUnsubscribeToken:
          profile.newsletterUnsubscribeToken as string,
        userProfileId: profile._id,
      }));
  },
});

export const createNewsletterCampaignRecord = internalMutation({
  args: {
    createdBy: v.id("userProfiles"),
    htmlContent: v.string(),
    plainTextContent: v.string(),
    previewText: v.optional(v.string()),
    recipientCount: v.number(),
    subject: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    return await ctx.db.insert("newsletterCampaigns", {
      audience: "subscribedMembers",
      createdAt: now,
      createdBy: args.createdBy,
      failedCount: 0,
      htmlContent: args.htmlContent,
      plainTextContent: args.plainTextContent,
      previewText: args.previewText,
      recipientCount: args.recipientCount,
      sentCount: 0,
      status: "sending",
      subject: args.subject,
      updatedAt: now,
    });
  },
});

export const finalizeNewsletterCampaignRecord = internalMutation({
  args: {
    campaignId: v.id("newsletterCampaigns"),
    failedCount: v.number(),
    failureMessage: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    sentCount: v.number(),
    status: v.union(
      v.literal("sent"),
      v.literal("failed"),
      v.literal("sending")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.campaignId, {
      failedCount: args.failedCount,
      failureMessage: args.failureMessage,
      sentAt: args.sentAt,
      sentCount: args.sentCount,
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
