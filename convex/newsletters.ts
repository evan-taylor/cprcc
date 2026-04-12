import { type EmailEvent, vEmailEvent } from "@convex-dev/resend";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  type MutationCtx,
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

const IMPORT_EMAIL_SYNTAX_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_IMPORT_ENTRIES = 2000;

function truncateImportDisplayName(name: string) {
  if (name.length <= 120) {
    return name;
  }
  return name.slice(0, 120).trimEnd();
}

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

interface ImportCounters {
  externalRemovedAsDuplicateCount: number;
  externalUpsertedCount: number;
  profileSubscribedCount: number;
  skippedAlreadyUnsubscribedCount: number;
}

async function applyNewsletterImportRow(
  ctx: MutationCtx,
  counters: ImportCounters,
  displayName: string,
  normalizedEmail: string,
  now: number,
  profileByNormalizedEmail: Map<string, Doc<"userProfiles">>
) {
  const profile = profileByNormalizedEmail.get(normalizedEmail);

  if (profile) {
    if (profile.newsletterStatus === NEWSLETTER_UNSUBSCRIBED) {
      counters.skippedAlreadyUnsubscribedCount += 1;
      // Member opted out; if a subscribed external row exists at this email,
      // remove it — getSubscribedRecipientsForSend dedupes externals only against
      // subscribed profiles, so this row would otherwise still receive mail.
      const externalWhenProfileOptedOut = await ctx.db
        .query("newsletterExternalSubscribers")
        .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
        .first();
      if (
        externalWhenProfileOptedOut &&
        externalWhenProfileOptedOut.newsletterStatus === NEWSLETTER_SUBSCRIBED
      ) {
        await ctx.db.delete(externalWhenProfileOptedOut._id);
        counters.externalRemovedAsDuplicateCount += 1;
      }
      return;
    }

    await ctx.db.patch(profile._id, {
      newsletterStatus: NEWSLETTER_SUBSCRIBED,
      newsletterStatusUpdatedAt: now,
      newsletterUnsubscribeToken:
        profile.newsletterUnsubscribeToken ??
        createNewsletterUnsubscribeToken(),
    });
    counters.profileSubscribedCount += 1;

    const externalAtEmail = await ctx.db
      .query("newsletterExternalSubscribers")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .first();

    if (externalAtEmail) {
      await ctx.db.delete(externalAtEmail._id);
      counters.externalRemovedAsDuplicateCount += 1;
    }
    return;
  }

  const existingExternal = await ctx.db
    .query("newsletterExternalSubscribers")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .first();

  if (existingExternal) {
    if (existingExternal.newsletterStatus === NEWSLETTER_UNSUBSCRIBED) {
      counters.skippedAlreadyUnsubscribedCount += 1;
      return;
    }

    await ctx.db.patch(existingExternal._id, {
      name: displayName,
      newsletterStatus: NEWSLETTER_SUBSCRIBED,
      newsletterStatusUpdatedAt: now,
      newsletterUnsubscribeToken:
        existingExternal.newsletterUnsubscribeToken ??
        createNewsletterUnsubscribeToken(),
    });
    counters.externalUpsertedCount += 1;
    return;
  }

  await ctx.db.insert("newsletterExternalSubscribers", {
    createdAt: now,
    email: normalizedEmail,
    name: displayName,
    newsletterStatus: NEWSLETTER_SUBSCRIBED,
    newsletterStatusUpdatedAt: now,
    newsletterUnsubscribeToken: createNewsletterUnsubscribeToken(),
  });
  counters.externalUpsertedCount += 1;
}

async function findProfilesByEmailAddress(ctx: MutationCtx, email: string) {
  const normalizedEmail = normalizeEmailAddress(email);

  const exactMatches = await ctx.db
    .query("userProfiles")
    .withIndex("by_email", (q) => q.eq("email", email))
    .collect();

  const normalizedIndexMatches =
    normalizedEmail === email
      ? []
      : await ctx.db
          .query("userProfiles")
          .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
          .collect();

  const uniqueProfiles = new Map<string, Doc<"userProfiles">>();
  for (const profile of [...exactMatches, ...normalizedIndexMatches]) {
    uniqueProfiles.set(profile._id, profile);
  }

  if (uniqueProfiles.size > 0) {
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

async function unsubscribeExternalSubscriberForBounce(
  ctx: MutationCtx,
  bouncedEmail: string
) {
  const normalizedEmail = normalizeEmailAddress(bouncedEmail);
  const externalSubscriber = await ctx.db
    .query("newsletterExternalSubscribers")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .first();

  if (!externalSubscriber) {
    return 0;
  }

  if (externalSubscriber.newsletterStatus === NEWSLETTER_UNSUBSCRIBED) {
    return 0;
  }

  const newsletterStatusUpdatedAt = Date.now();
  await ctx.db.patch(externalSubscriber._id, {
    newsletterStatus: NEWSLETTER_UNSUBSCRIBED,
    newsletterStatusUpdatedAt,
    newsletterUnsubscribeToken:
      externalSubscriber.newsletterUnsubscribeToken ??
      createNewsletterUnsubscribeToken(),
  });

  return 1;
}

function getEventRecipientEmails(event: EmailEvent) {
  const recipients = event.data.to;
  return Array.isArray(recipients) ? recipients : [recipients];
}

export const handleResendEmailEvent = internalMutation({
  args: {
    event: vEmailEvent,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.event.type !== "email.bounced") {
      return null;
    }

    const recipients = getEventRecipientEmails(args.event);
    for (const recipient of recipients) {
      await unsubscribeProfilesForBounce(ctx, recipient);
      await unsubscribeExternalSubscriberForBounce(ctx, recipient);
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

    if (userProfile) {
      return {
        email: userProfile.email,
        name: userProfile.name,
        newsletterStatus: getResolvedNewsletterStatus(
          userProfile.newsletterStatus
        ),
        newsletterStatusUpdatedAt: userProfile.newsletterStatusUpdatedAt,
      };
    }

    const externalSubscriber = await ctx.db
      .query("newsletterExternalSubscribers")
      .withIndex("by_newsletter_unsubscribe_token", (q) =>
        q.eq("newsletterUnsubscribeToken", args.token)
      )
      .unique();

    if (!externalSubscriber) {
      return null;
    }

    return {
      email: externalSubscriber.email,
      name: externalSubscriber.name,
      newsletterStatus: getResolvedNewsletterStatus(
        externalSubscriber.newsletterStatus
      ),
      newsletterStatusUpdatedAt: externalSubscriber.newsletterStatusUpdatedAt,
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

    const newsletterStatusUpdatedAt = Date.now();

    if (userProfile) {
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
    }

    const externalSubscriber = await ctx.db
      .query("newsletterExternalSubscribers")
      .withIndex("by_newsletter_unsubscribe_token", (q) =>
        q.eq("newsletterUnsubscribeToken", args.token)
      )
      .unique();

    if (!externalSubscriber) {
      throw new Error("Invalid unsubscribe link");
    }

    await ctx.db.patch(externalSubscriber._id, {
      newsletterStatus: NEWSLETTER_UNSUBSCRIBED,
      newsletterStatusUpdatedAt,
      newsletterUnsubscribeToken:
        externalSubscriber.newsletterUnsubscribeToken ??
        createNewsletterUnsubscribeToken(),
    });

    return {
      email: externalSubscriber.email,
      newsletterStatus: NEWSLETTER_UNSUBSCRIBED,
      newsletterStatusUpdatedAt,
    };
  },
});

export const getNewsletterAdminOverview = query({
  args: {},
  returns: v.object({
    importedSubscribersCount: v.number(),
    importedSubscribersPreview: v.array(
      v.object({
        _id: v.id("newsletterExternalSubscribers"),
        email: v.string(),
        name: v.string(),
      })
    ),
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
    totalNewsletterRecipients: v.number(),
    unsubscribedMembersCount: v.number(),
  }),
  handler: async (ctx) => {
    await requireBoardMember(ctx);

    const [allProfiles, subscribedProfiles, campaigns, importedSubscribers] =
      await Promise.all([
        ctx.db.query("userProfiles").collect(),
        ctx.db
          .query("userProfiles")
          .withIndex("by_newsletter_status", (q) =>
            q.eq("newsletterStatus", NEWSLETTER_SUBSCRIBED)
          )
          .collect(),
        ctx.db.query("newsletterCampaigns").collect(),
        ctx.db
          .query("newsletterExternalSubscribers")
          .withIndex("by_newsletter_status", (q) =>
            q.eq("newsletterStatus", NEWSLETTER_SUBSCRIBED)
          )
          .collect(),
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

    const importedSubscribersPreview = [...importedSubscribers]
      .sort((left, right) => left.email.localeCompare(right.email))
      .slice(0, 8)
      .map((subscriber) => ({
        _id: subscriber._id,
        email: subscriber.email,
        name: subscriber.name,
      }));

    return {
      importedSubscribersCount: importedSubscribers.length,
      importedSubscribersPreview,
      recentCampaigns,
      subscribedMembersCount: subscribedProfiles.length,
      subscribedMembersPreview,
      totalMembersCount: allProfiles.length,
      totalNewsletterRecipients:
        subscribedProfiles.length + importedSubscribers.length,
      unsubscribedMembersCount: allProfiles.length - subscribedProfiles.length,
    };
  },
});

export const getSubscribedRecipientsForSend = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [subscribedProfiles, importedSubscribers] = await Promise.all([
      ctx.db
        .query("userProfiles")
        .withIndex("by_newsletter_status", (q) =>
          q.eq("newsletterStatus", NEWSLETTER_SUBSCRIBED)
        )
        .collect(),
      ctx.db
        .query("newsletterExternalSubscribers")
        .withIndex("by_newsletter_status", (q) =>
          q.eq("newsletterStatus", NEWSLETTER_SUBSCRIBED)
        )
        .collect(),
    ]);

    const profileRecipients = subscribedProfiles
      .filter((profile) => !!profile.newsletterUnsubscribeToken)
      .map((profile) => ({
        email: profile.email,
        name: profile.name,
        newsletterUnsubscribeToken:
          profile.newsletterUnsubscribeToken as string,
        userProfileId: profile._id,
      }));

    const profileEmails = new Set(
      profileRecipients.map((recipient) =>
        normalizeEmailAddress(recipient.email)
      )
    );

    const externalRecipients = importedSubscribers
      .filter((subscriber) => !!subscriber.newsletterUnsubscribeToken)
      .filter(
        (subscriber) =>
          !profileEmails.has(normalizeEmailAddress(subscriber.email))
      )
      .map((subscriber) => ({
        email: subscriber.email,
        name: subscriber.name,
        newsletterUnsubscribeToken:
          subscriber.newsletterUnsubscribeToken as string,
      }));

    return [...profileRecipients, ...externalRecipients];
  },
});

export const importNewsletterSubscribers = mutation({
  args: {
    entries: v.array(
      v.object({
        email: v.string(),
        name: v.optional(v.string()),
      })
    ),
  },
  returns: v.object({
    externalRemovedAsDuplicateCount: v.number(),
    externalUpsertedCount: v.number(),
    profileSubscribedCount: v.number(),
    skippedAlreadyUnsubscribedCount: v.number(),
    skippedInvalidCount: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    if (args.entries.length > MAX_IMPORT_ENTRIES) {
      throw new Error(
        `Too many rows at once. Maximum ${MAX_IMPORT_ENTRIES} per import.`
      );
    }

    const allProfiles = await ctx.db.query("userProfiles").collect();
    const profileByNormalizedEmail = new Map<string, Doc<"userProfiles">>();
    for (const profile of allProfiles) {
      const key = normalizeEmailAddress(profile.email);
      if (!profileByNormalizedEmail.has(key)) {
        profileByNormalizedEmail.set(key, profile);
      }
    }

    const counters: ImportCounters = {
      externalRemovedAsDuplicateCount: 0,
      externalUpsertedCount: 0,
      profileSubscribedCount: 0,
      skippedAlreadyUnsubscribedCount: 0,
    };
    let skippedInvalidCount = 0;
    const now = Date.now();

    for (const entry of args.entries) {
      const normalizedEmail = normalizeEmailAddress(entry.email);
      if (!IMPORT_EMAIL_SYNTAX_REGEX.test(normalizedEmail)) {
        skippedInvalidCount += 1;
        continue;
      }

      const nameRaw = entry.name?.trim();
      const displayName = nameRaw
        ? truncateImportDisplayName(nameRaw)
        : "Newsletter subscriber";

      await applyNewsletterImportRow(
        ctx,
        counters,
        displayName,
        normalizedEmail,
        now,
        profileByNormalizedEmail
      );
    }

    return {
      externalRemovedAsDuplicateCount: counters.externalRemovedAsDuplicateCount,
      externalUpsertedCount: counters.externalUpsertedCount,
      profileSubscribedCount: counters.profileSubscribedCount,
      skippedAlreadyUnsubscribedCount: counters.skippedAlreadyUnsubscribedCount,
      skippedInvalidCount,
    };
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
