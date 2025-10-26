import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is normally optional, but Convex Auth
// requires indexes defined on `authTables`.
// The schema provides more precise TypeScript types.
export default defineSchema({
  ...authTables,
  numbers: defineTable({
    value: v.number(),
  }),
  userProfiles: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("member"), v.literal("board")),
    userId: v.id("users"),
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"]),
});
