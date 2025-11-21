import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (userProfile.role !== "board") {
      throw new Error("Only board members can upload photos");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const savePhoto = mutation({
  args: {
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (userProfile.role !== "board") {
      throw new Error("Only board members can upload photos");
    }

    const photoId = await ctx.db.insert("photos", {
      storageId: args.storageId,
      caption: args.caption,
      uploadedBy: userProfile._id,
      uploadedAt: Date.now(),
    });

    return photoId;
  },
});

export const listPhotos = query({
  handler: async (ctx) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_uploaded_at")
      .order("desc")
      .collect();

    const photosWithDetails = await Promise.all(
      photos.map(async (photo) => {
        const uploader = await ctx.db.get(photo.uploadedBy);
        const url = await ctx.storage.getUrl(photo.storageId);

        return {
          ...photo,
          url,
          uploaderName: uploader?.name || "Unknown",
        };
      })
    );

    return photosWithDetails;
  },
});

export const deletePhoto = mutation({
  args: {
    photoId: v.id("photos"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile) {
      throw new Error("User profile not found");
    }

    if (userProfile.role !== "board") {
      throw new Error("Only board members can delete photos");
    }

    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new Error("Photo not found");
    }

    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete(args.photoId);
  },
});
