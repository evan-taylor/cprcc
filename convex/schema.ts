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
    phoneNumber: v.optional(v.string()),
    role: v.union(v.literal("member"), v.literal("board")),
    userId: v.id("users"),
  })
    .index("by_user_id", ["userId"])
    .index("by_email", ["email"]),
  events: defineTable({
    title: v.string(),
    description: v.string(),
    location: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    eventType: v.union(v.literal("regular"), v.literal("boothing")),
    isOffsite: v.boolean(),
    createdBy: v.id("userProfiles"),
    createdAt: v.number(),
  })
    .index("by_start_time", ["startTime"])
    .index("by_created_by", ["createdBy"]),
  shifts: defineTable({
    eventId: v.id("events"),
    startTime: v.number(),
    endTime: v.number(),
    requiredPeople: v.number(),
  }).index("by_event", ["eventId"]),
  rsvps: defineTable({
    eventId: v.id("events"),
    userProfileId: v.id("userProfiles"),
    shiftId: v.optional(v.id("shifts")),
    needsRide: v.boolean(),
    canDrive: v.boolean(),
    driverInfo: v.optional(
      v.object({
        carType: v.string(),
        carColor: v.string(),
        capacity: v.number(),
      })
    ),
    createdAt: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_user", ["userProfileId"])
    .index("by_shift", ["shiftId"])
    .index("by_event_and_user", ["eventId", "userProfileId"]),
  carpools: defineTable({
    eventId: v.id("events"),
    driverRsvpId: v.id("rsvps"),
    status: v.union(v.literal("draft"), v.literal("finalized")),
    createdAt: v.number(),
  }).index("by_event", ["eventId"]),
  carpoolMembers: defineTable({
    carpoolId: v.id("carpools"),
    rsvpId: v.id("rsvps"),
  })
    .index("by_carpool", ["carpoolId"])
    .index("by_rsvp", ["rsvpId"]),
});
