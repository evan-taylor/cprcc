import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Normalize phone number to E.164 format (or close to it)
 * - Strips all non-digit characters
 * - If 10 digits, assumes US number and prepends +1
 * - Returns normalized string or throws error if invalid
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length < 7 || digits.length > 15) {
    throw new Error("Phone number must be between 7 and 15 digits");
  }

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return digits.startsWith("+") ? digits : `+${digits}`;
}

/**
 * Format phone number for display
 * Converts +15551234567 to (555) 123-4567
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    const areaCode = digits.slice(1, 4);
    const prefix = digits.slice(4, 7);
    const lineNumber = digits.slice(7, 11);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }

  if (digits.length === 10) {
    const areaCode = digits.slice(0, 3);
    const prefix = digits.slice(3, 6);
    const lineNumber = digits.slice(6, 10);
    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }

  return phone.startsWith("+") ? phone : `+${phone}`;
}

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return null;
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    return userProfile;
  },
});

export const ensureCurrentUserProfile = mutation({
  args: {
    phoneNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    const authUser = await ctx.db.get(authUserId);
    if (!authUser) {
      throw new Error("Auth user not found");
    }

    const email = (authUser as { email?: string }).email as string;
    const name = (authUser as { name?: string }).name as string;

    const isAdmin = email.trim().toLowerCase() === "etaylo28@calpoly.edu";
    const role = isAdmin ? "board" : "member";

    if (existingProfile) {
      if (isAdmin && existingProfile.role !== "board") {
        await ctx.db.patch(existingProfile._id, { role: "board" });
      }
      if (args.phoneNumber && !existingProfile.phoneNumber) {
        const normalized = normalizePhoneNumber(args.phoneNumber);
        await ctx.db.patch(existingProfile._id, { phoneNumber: normalized });
      }
      return existingProfile._id;
    }

    const phoneNumber = args.phoneNumber
      ? normalizePhoneNumber(args.phoneNumber)
      : undefined;

    const profileId = await ctx.db.insert("userProfiles", {
      name,
      email,
      phoneNumber,
      role,
      userId: authUserId,
    });

    return profileId;
  },
});

export const createUserProfile = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    const isAdmin = args.email.trim().toLowerCase() === "etaylo28@calpoly.edu";
    const role = isAdmin ? "board" : "member";

    if (existingProfile) {
      if (isAdmin && existingProfile.role !== "board") {
        await ctx.db.patch(existingProfile._id, { role: "board" });
      }
      return existingProfile._id;
    }

    const profileId = await ctx.db.insert("userProfiles", {
      name: args.name,
      email: args.email,
      role,
      userId: authUserId,
    });

    return profileId;
  },
});

export const promoteToBoard = mutation({
  args: {
    profileId: v.id("userProfiles"),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    if (!currentUserProfile || currentUserProfile.role !== "board") {
      throw new Error("Only board members can promote users");
    }

    await ctx.db.patch(args.profileId, {
      role: "board",
    });
  },
});

export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const currentUserProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    if (!currentUserProfile || currentUserProfile.role !== "board") {
      throw new Error("Only board members can view all users");
    }

    const userProfiles = await ctx.db.query("userProfiles").collect();
    return userProfiles;
  },
});

export const updatePhoneNumber = mutation({
  args: {
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const normalized = normalizePhoneNumber(args.phoneNumber);

    await ctx.db.patch(userProfile._id, {
      phoneNumber: normalized,
    });

    return normalized;
  },
});
