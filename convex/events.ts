import { v } from "convex/values";
import type { QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { getCurrentUserProfile, requireBoardMember } from "./lib/auth";

function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

async function generateUniqueSlug(
  ctx: QueryCtx,
  baseSlug: string,
  excludeEventId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (!existing || existing._id === excludeEventId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export const createEvent = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    location: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    eventType: v.union(v.literal("regular"), v.literal("boothing")),
    isOffsite: v.boolean(),
    slug: v.optional(v.string()),
    shifts: v.optional(
      v.array(
        v.object({
          startTime: v.number(),
          endTime: v.number(),
          requiredPeople: v.number(),
        })
      )
    ),
  },
  returns: v.id("events"),
  handler: async (ctx, args) => {
    const userProfile = await requireBoardMember(ctx);

    const baseSlug = args.slug || generateSlugFromTitle(args.title);
    const uniqueSlug = await generateUniqueSlug(ctx, baseSlug);

    const eventId = await ctx.db.insert("events", {
      title: args.title,
      description: args.description,
      location: args.location,
      startTime: args.startTime,
      endTime: args.endTime,
      eventType: args.eventType,
      isOffsite: args.isOffsite,
      slug: uniqueSlug,
      createdBy: userProfile._id,
      createdAt: Date.now(),
    });

    if (args.eventType === "boothing" && args.shifts) {
      for (const shift of args.shifts) {
        await ctx.db.insert("shifts", {
          eventId,
          startTime: shift.startTime,
          endTime: shift.endTime,
          requiredPeople: shift.requiredPeople,
        });
      }
    }

    return eventId;
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    isOffsite: v.optional(v.boolean()),
    slug: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    const updates: Record<string, string | number | boolean> = {};
    if (args.title !== undefined) {
      updates.title = args.title;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }
    if (args.location !== undefined) {
      updates.location = args.location;
    }
    if (args.startTime !== undefined) {
      updates.startTime = args.startTime;
    }
    if (args.endTime !== undefined) {
      updates.endTime = args.endTime;
    }
    if (args.isOffsite !== undefined) {
      updates.isOffsite = args.isOffsite;
    }
    if (args.slug !== undefined) {
      const baseSlug =
        args.slug || generateSlugFromTitle(args.title || event.title);
      const uniqueSlug = await generateUniqueSlug(ctx, baseSlug, args.eventId);
      updates.slug = uniqueSlug;
    }

    await ctx.db.patch(args.eventId, updates);
  },
});

export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const shifts = await ctx.db
      .query("shifts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const shift of shifts) {
      await ctx.db.delete(shift._id);
    }

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const rsvp of rsvps) {
      await ctx.db.delete(rsvp._id);
    }

    const carpools = await ctx.db
      .query("carpools")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const carpool of carpools) {
      const carpoolMembers = await ctx.db
        .query("carpoolMembers")
        .withIndex("by_carpool", (q) => q.eq("carpoolId", carpool._id))
        .collect();

      for (const member of carpoolMembers) {
        await ctx.db.delete(member._id);
      }

      await ctx.db.delete(carpool._id);
    }

    await ctx.db.delete(args.eventId);
  },
});

export const listEvents = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("events"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      location: v.string(),
      startTime: v.number(),
      endTime: v.number(),
      eventType: v.union(v.literal("regular"), v.literal("boothing")),
      isOffsite: v.boolean(),
      slug: v.optional(v.string()),
      createdBy: v.id("userProfiles"),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_start_time")
      .order("asc")
      .collect();

    return events;
  },
});

export const listUpcomingEvents = query({
  args: {
    now: v.number(),
  },
  returns: v.array(
    v.object({
      _id: v.id("events"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      location: v.string(),
      startTime: v.number(),
      endTime: v.number(),
      eventType: v.union(v.literal("regular"), v.literal("boothing")),
      isOffsite: v.boolean(),
      slug: v.optional(v.string()),
      createdBy: v.id("userProfiles"),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_start_time", (q) => q.gte("startTime", args.now))
      .order("asc")
      .collect();

    return events;
  },
});

export const getEvent = query({
  args: {
    eventId: v.id("events"),
  },
  returns: v.union(
    v.object({
      _id: v.id("events"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      location: v.string(),
      startTime: v.number(),
      endTime: v.number(),
      eventType: v.union(v.literal("regular"), v.literal("boothing")),
      isOffsite: v.boolean(),
      slug: v.optional(v.string()),
      createdBy: v.id("userProfiles"),
      createdAt: v.number(),
      shifts: v.array(
        v.object({
          _id: v.id("shifts"),
          _creationTime: v.number(),
          eventId: v.id("events"),
          startTime: v.number(),
          endTime: v.number(),
          requiredPeople: v.number(),
        })
      ),
      rsvps: v.array(
        v.object({
          _id: v.id("rsvps"),
          _creationTime: v.number(),
          eventId: v.id("events"),
          userProfileId: v.id("userProfiles"),
          shiftId: v.optional(v.id("shifts")),
          needsRide: v.boolean(),
          canDrive: v.boolean(),
          selfTransport: v.optional(v.boolean()),
          driverInfo: v.optional(
            v.object({
              carType: v.string(),
              carColor: v.string(),
              capacity: v.number(),
            })
          ),
          createdAt: v.number(),
          userName: v.string(),
          userEmail: v.optional(v.string()),
          userPhoneNumber: v.optional(v.string()),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return null;
    }

    const callerProfile = await getCurrentUserProfile(ctx);
    const isBoardMember = callerProfile?.role === "board";

    const shifts = await ctx.db
      .query("shifts")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const rsvpDetails = await Promise.all(
      rsvps.map(async (rsvp) => {
        const userProfile = await ctx.db.get(rsvp.userProfileId);
        return {
          ...rsvp,
          userName: userProfile?.name ?? "Unknown",
          ...(isBoardMember
            ? {
                userEmail: userProfile?.email ?? "",
                userPhoneNumber: userProfile?.phoneNumber,
              }
            : {}),
        };
      })
    );

    return {
      ...event,
      shifts: shifts.sort((a, b) => a.startTime - b.startTime),
      rsvps: rsvpDetails,
    };
  },
});

export const getEventBySlug = query({
  args: {
    slug: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("events"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      location: v.string(),
      startTime: v.number(),
      endTime: v.number(),
      eventType: v.union(v.literal("regular"), v.literal("boothing")),
      isOffsite: v.boolean(),
      slug: v.optional(v.string()),
      createdBy: v.id("userProfiles"),
      createdAt: v.number(),
      shifts: v.array(
        v.object({
          _id: v.id("shifts"),
          _creationTime: v.number(),
          eventId: v.id("events"),
          startTime: v.number(),
          endTime: v.number(),
          requiredPeople: v.number(),
        })
      ),
      rsvps: v.array(
        v.object({
          _id: v.id("rsvps"),
          _creationTime: v.number(),
          eventId: v.id("events"),
          userProfileId: v.id("userProfiles"),
          shiftId: v.optional(v.id("shifts")),
          needsRide: v.boolean(),
          canDrive: v.boolean(),
          selfTransport: v.optional(v.boolean()),
          driverInfo: v.optional(
            v.object({
              carType: v.string(),
              carColor: v.string(),
              capacity: v.number(),
            })
          ),
          createdAt: v.number(),
          userName: v.string(),
          userEmail: v.optional(v.string()),
          userPhoneNumber: v.optional(v.string()),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!event) {
      return null;
    }

    const callerProfile = await getCurrentUserProfile(ctx);
    const isBoardMember = callerProfile?.role === "board";

    const shifts = await ctx.db
      .query("shifts")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q) => q.eq("eventId", event._id))
      .collect();

    const rsvpDetails = await Promise.all(
      rsvps.map(async (rsvp) => {
        const userProfile = await ctx.db.get(rsvp.userProfileId);
        return {
          ...rsvp,
          userName: userProfile?.name ?? "Unknown",
          ...(isBoardMember
            ? {
                userEmail: userProfile?.email ?? "",
                userPhoneNumber: userProfile?.phoneNumber,
              }
            : {}),
        };
      })
    );

    return {
      ...event,
      shifts: shifts.sort((a, b) => a.startTime - b.startTime),
      rsvps: rsvpDetails,
    };
  },
});

export const generateSlugSuggestion = query({
  args: {
    title: v.string(),
    excludeEventId: v.optional(v.id("events")),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const baseSlug = generateSlugFromTitle(args.title);
    const uniqueSlug = await generateUniqueSlug(
      ctx,
      baseSlug,
      args.excludeEventId
    );
    return uniqueSlug;
  },
});

export const addShift = mutation({
  args: {
    eventId: v.id("events"),
    startTime: v.number(),
    endTime: v.number(),
    requiredPeople: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (event.eventType !== "boothing") {
      throw new Error("Can only add shifts to boothing events");
    }

    await ctx.db.insert("shifts", {
      eventId: args.eventId,
      startTime: args.startTime,
      endTime: args.endTime,
      requiredPeople: args.requiredPeople,
    });
  },
});

export const updateShift = mutation({
  args: {
    shiftId: v.id("shifts"),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    requiredPeople: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const shift = await ctx.db.get(args.shiftId);
    if (!shift) {
      throw new Error("Shift not found");
    }

    const updates: Record<string, number> = {};
    if (args.startTime !== undefined) {
      updates.startTime = args.startTime;
    }
    if (args.endTime !== undefined) {
      updates.endTime = args.endTime;
    }
    if (args.requiredPeople !== undefined) {
      updates.requiredPeople = args.requiredPeople;
    }

    await ctx.db.patch(args.shiftId, updates);
  },
});

export const deleteShift = mutation({
  args: {
    shiftId: v.id("shifts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireBoardMember(ctx);

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_shift", (q) => q.eq("shiftId", args.shiftId))
      .collect();

    for (const rsvp of rsvps) {
      await ctx.db.patch(rsvp._id, { shiftId: undefined });
    }

    await ctx.db.delete(args.shiftId);
  },
});

export const getShiftRsvps = query({
  args: {
    shiftId: v.id("shifts"),
  },
  returns: v.union(
    v.object({
      shift: v.object({
        _id: v.id("shifts"),
        _creationTime: v.number(),
        eventId: v.id("events"),
        startTime: v.number(),
        endTime: v.number(),
        requiredPeople: v.number(),
      }),
      rsvps: v.array(
        v.object({
          _id: v.id("rsvps"),
          _creationTime: v.number(),
          eventId: v.id("events"),
          userProfileId: v.id("userProfiles"),
          shiftId: v.optional(v.id("shifts")),
          needsRide: v.boolean(),
          canDrive: v.boolean(),
          selfTransport: v.optional(v.boolean()),
          driverInfo: v.optional(
            v.object({
              carType: v.string(),
              carColor: v.string(),
              capacity: v.number(),
            })
          ),
          createdAt: v.number(),
          userName: v.string(),
          userEmail: v.optional(v.string()),
          userPhoneNumber: v.optional(v.string()),
        })
      ),
      currentCount: v.number(),
      requiredCount: v.number(),
      isFull: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const shift = await ctx.db.get(args.shiftId);
    if (!shift) {
      return null;
    }

    const callerProfile = await getCurrentUserProfile(ctx);
    const isBoardMember = callerProfile?.role === "board";

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_shift", (q) => q.eq("shiftId", args.shiftId))
      .collect();

    const rsvpDetails = await Promise.all(
      rsvps.map(async (rsvp) => {
        const userProfile = await ctx.db.get(rsvp.userProfileId);
        return {
          ...rsvp,
          userName: userProfile?.name ?? "Unknown",
          ...(isBoardMember
            ? {
                userEmail: userProfile?.email ?? "",
                userPhoneNumber: userProfile?.phoneNumber,
              }
            : {}),
        };
      })
    );

    return {
      shift,
      rsvps: rsvpDetails,
      currentCount: rsvpDetails.length,
      requiredCount: shift.requiredPeople,
      isFull: rsvpDetails.length >= shift.requiredPeople,
    };
  },
});

/**
 * Backfill migration to add slugs to existing events that don't have them.
 * This should be run once after deploying the optional slug schema change.
 * Run this from the Convex dashboard or via a temporary admin page.
 */
export const backfillEventSlugs = mutation({
  args: {},
  returns: v.object({
    totalEvents: v.number(),
    eventsWithoutSlugs: v.number(),
    updated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    await requireBoardMember(ctx);

    const allEvents = await ctx.db.query("events").collect();
    const eventsWithoutSlugs = allEvents.filter((event) => !event.slug);

    let updated = 0;
    let skipped = 0;

    for (const event of eventsWithoutSlugs) {
      try {
        const baseSlug = generateSlugFromTitle(event.title);
        const uniqueSlug = await generateUniqueSlug(ctx, baseSlug, event._id);

        await ctx.db.patch(event._id, { slug: uniqueSlug });
        updated++;
      } catch (err) {
        console.error(`Failed to generate slug for event ${event._id}:`, err);
        skipped++;
      }
    }

    return {
      totalEvents: allEvents.length,
      eventsWithoutSlugs: eventsWithoutSlugs.length,
      updated,
      skipped,
    };
  },
});
