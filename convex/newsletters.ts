import { v } from "convex/values";
import {
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
