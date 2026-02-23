import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireBoardMember } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireBoardMember(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const savePhoto = mutation({
  args: {
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
  },
  returns: v.id("photos"),
  handler: async (ctx, args) => {
    const userProfile = await requireBoardMember(ctx);

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
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("photos"),
      _creationTime: v.number(),
      storageId: v.id("_storage"),
      caption: v.optional(v.string()),
      uploadedBy: v.id("userProfiles"),
      uploadedAt: v.number(),
      url: v.union(v.string(), v.null()),
      uploaderName: v.string(),
    })
  ),
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
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const photo = await ctx.db.get(args.photoId);
    if (!photo) {
      throw new Error("Photo not found");
    }

    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete(args.photoId);
  },
});
