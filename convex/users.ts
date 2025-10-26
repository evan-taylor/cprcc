import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
