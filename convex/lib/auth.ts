import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

/**
 * Get the authenticated user's profile.
 * Returns the user profile or null if not authenticated or profile not found.
 */
export async function getCurrentUserProfile(
  ctx: QueryCtx | MutationCtx
): Promise<{
  _id: Id<"userProfiles">;
  _creationTime: number;
  name: string;
  email: string;
  phoneNumber?: string;
  role: "member" | "board";
  userId: Id<"users">;
} | null> {
  const authUserId = await getAuthUserId(ctx);
  if (!authUserId) {
    return null;
  }

  const userProfile = await ctx.db
    .query("userProfiles")
    .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
    .first();

  return userProfile ?? null;
}

/**
 * Require authentication.
 * Throws an error if the user is not authenticated.
 * Returns the user profile.
 */
export async function requireAuth(ctx: QueryCtx | MutationCtx) {
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

  return userProfile;
}

/**
 * Require board member access.
 * Throws an error if the user is not authenticated or not a board member.
 * Returns the user profile.
 */
export async function requireBoardMember(ctx: QueryCtx | MutationCtx) {
  const userProfile = await requireAuth(ctx);

  if (userProfile.role !== "board") {
    throw new Error("Only board members can perform this action");
  }

  return userProfile;
}
