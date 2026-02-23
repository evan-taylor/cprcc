import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

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
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can create events");
    }

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
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can update events");
    }

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
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can delete events");
    }

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
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const events = await ctx.db
      .query("events")
      .withIndex("by_start_time")
      .order("asc")
      .filter((q) => q.gte(q.field("startTime"), now))
      .collect();

    return events;
  },
});

export const getEvent = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) {
      return null;
    }

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
          userEmail: userProfile?.email ?? "",
          userPhoneNumber: userProfile?.phoneNumber,
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
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("events")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!event) {
      return null;
    }

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
          userEmail: userProfile?.email ?? "",
          userPhoneNumber: userProfile?.phoneNumber,
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

function validateTransportOptions(args: {
  canDrive: boolean;
  driverInfo?: { carType: string; carColor: string; capacity: number };
  needsRide: boolean;
  selfTransport: boolean;
}) {
  if (args.canDrive && !args.driverInfo) {
    throw new Error("Driver info required when offering to drive");
  }
  if (args.needsRide && args.canDrive) {
    throw new Error("Cannot both need a ride and offer to drive");
  }
  if (args.selfTransport && (args.needsRide || args.canDrive)) {
    throw new Error(
      "Cannot select self-transport with other transportation options"
    );
  }
}

async function validateShiftCapacity(
  ctx: MutationCtx,
  eventId: Id<"events">,
  shiftId: Id<"shifts">,
  userProfileId: Id<"userProfiles">
) {
  const shift = await ctx.db.get(shiftId);
  if (!shift || shift.eventId !== eventId) {
    throw new Error("Invalid shift for this event");
  }

  const existingShiftRsvps = await ctx.db
    .query("rsvps")
    .withIndex("by_shift", (q) => q.eq("shiftId", shiftId))
    .collect();

  const existingRsvp = await ctx.db
    .query("rsvps")
    .withIndex("by_event_and_user", (q) =>
      q.eq("eventId", eventId).eq("userProfileId", userProfileId)
    )
    .first();

  const isUserAlreadyInShift = existingRsvp?.shiftId === shiftId;

  if (
    !isUserAlreadyInShift &&
    existingShiftRsvps.length >= shift.requiredPeople
  ) {
    throw new Error("This shift is already full");
  }
}

export const createRsvp = mutation({
  args: {
    eventId: v.id("events"),
    shiftId: v.optional(v.id("shifts")),
    needsRide: v.boolean(),
    canDrive: v.boolean(),
    selfTransport: v.boolean(),
    driverInfo: v.optional(
      v.object({
        carType: v.string(),
        carColor: v.string(),
        capacity: v.number(),
      })
    ),
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

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    validateTransportOptions(args);

    if (args.shiftId) {
      await validateShiftCapacity(
        ctx,
        args.eventId,
        args.shiftId,
        userProfile._id
      );
    }

    const existingRsvp = await ctx.db
      .query("rsvps")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userProfileId", userProfile._id)
      )
      .first();

    if (existingRsvp) {
      if (args.shiftId && existingRsvp.shiftId !== args.shiftId) {
        await ctx.db.insert("rsvps", {
          eventId: args.eventId,
          userProfileId: userProfile._id,
          shiftId: args.shiftId,
          needsRide: args.needsRide,
          canDrive: args.canDrive,
          selfTransport: args.selfTransport,
          driverInfo: args.driverInfo,
          createdAt: Date.now(),
        });
        return;
      }

      await ctx.db.patch(existingRsvp._id, {
        shiftId: args.shiftId,
        needsRide: args.needsRide,
        canDrive: args.canDrive,
        selfTransport: args.selfTransport,
        driverInfo: args.driverInfo,
      });
      return;
    }

    await ctx.db.insert("rsvps", {
      eventId: args.eventId,
      userProfileId: userProfile._id,
      shiftId: args.shiftId,
      needsRide: args.needsRide,
      canDrive: args.canDrive,
      selfTransport: args.selfTransport,
      driverInfo: args.driverInfo,
      createdAt: Date.now(),
    });
  },
});

export const deleteRsvp = mutation({
  args: {
    rsvpId: v.id("rsvps"),
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

    const rsvp = await ctx.db.get(args.rsvpId);
    if (!rsvp) {
      throw new Error("RSVP not found");
    }

    if (
      rsvp.userProfileId !== userProfile._id &&
      userProfile.role !== "board"
    ) {
      throw new Error("Can only delete your own RSVPs");
    }

    await ctx.db.delete(args.rsvpId);
  },
});

export const getUserRsvps = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      return [];
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    if (!userProfile) {
      return [];
    }

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_user", (q) => q.eq("userProfileId", userProfile._id))
      .collect();

    const rsvpDetails = await Promise.all(
      rsvps.map(async (rsvp) => {
        const event = await ctx.db.get(rsvp.eventId);
        const shift = rsvp.shiftId ? await ctx.db.get(rsvp.shiftId) : null;
        return {
          ...rsvp,
          event,
          shift,
        };
      })
    );

    return rsvpDetails;
  },
});

export const addShift = mutation({
  args: {
    eventId: v.id("events"),
    startTime: v.number(),
    endTime: v.number(),
    requiredPeople: v.number(),
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

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can add shifts");
    }

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
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can update shifts");
    }

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
  handler: async (ctx, args) => {
    const authUserId = await getAuthUserId(ctx);
    if (!authUserId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", authUserId))
      .first();

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can delete shifts");
    }

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
  handler: async (ctx, args) => {
    const shift = await ctx.db.get(args.shiftId);
    if (!shift) {
      return null;
    }

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
          userEmail: userProfile?.email ?? "",
          userPhoneNumber: userProfile?.phoneNumber,
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

function deduplicateByUser<
  T extends { userProfileId: string; createdAt: number },
>(rsvps: T[]): T[] {
  const byUser = new Map<string, T>();
  for (const rsvp of rsvps) {
    const existing = byUser.get(rsvp.userProfileId);
    if (!existing || rsvp.createdAt > existing.createdAt) {
      byUser.set(rsvp.userProfileId, rsvp);
    }
  }
  return Array.from(byUser.values());
}

async function deleteExistingCarpools(ctx: MutationCtx, eventId: Id<"events">) {
  const existingCarpools = await ctx.db
    .query("carpools")
    .withIndex("by_event", (q) => q.eq("eventId", eventId))
    .collect();

  for (const carpool of existingCarpools) {
    const members = await ctx.db
      .query("carpoolMembers")
      .withIndex("by_carpool", (q) => q.eq("carpoolId", carpool._id))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }
    await ctx.db.delete(carpool._id);
  }
}

function assignRidersToDrivers<
  D extends { _id: string; driverInfo?: { capacity: number } | undefined },
  R extends { _id: string },
>(drivers: D[], riders: R[]) {
  const unassigned = [...riders];
  const assignments: Array<{
    driverRsvpId: D["_id"];
    riderRsvpIds: R["_id"][];
  }> = [];

  for (const driver of drivers) {
    const capacity = driver.driverInfo?.capacity ?? 0;
    const assigned: R["_id"][] = [];

    for (let i = 0; i < capacity && unassigned.length > 0; i++) {
      const rider = unassigned.shift();
      if (rider) {
        assigned.push(rider._id);
      }
    }

    assignments.push({ driverRsvpId: driver._id, riderRsvpIds: assigned });
  }

  return { assignments, unassignedCount: unassigned.length };
}

export const generateCarpools = mutation({
  args: {
    eventId: v.id("events"),
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

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can generate carpools");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (!event.isOffsite) {
      throw new Error("Can only generate carpools for offsite events");
    }

    await deleteExistingCarpools(ctx, args.eventId);

    const rsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const drivers = deduplicateByUser(
      rsvps.filter(
        (rsvp) => rsvp.canDrive && rsvp.driverInfo && !rsvp.selfTransport
      )
    );
    const riders = deduplicateByUser(
      rsvps.filter((rsvp) => rsvp.needsRide && !rsvp.selfTransport)
    );

    if (riders.length > 0 && drivers.length === 0) {
      throw new Error("No drivers available for riders");
    }

    const { assignments, unassignedCount } = assignRidersToDrivers(
      drivers,
      riders
    );

    for (const assignment of assignments) {
      const carpoolId = await ctx.db.insert("carpools", {
        eventId: args.eventId,
        driverRsvpId: assignment.driverRsvpId,
        status: "draft",
        createdAt: Date.now(),
      });

      for (const riderRsvpId of assignment.riderRsvpIds) {
        await ctx.db.insert("carpoolMembers", {
          carpoolId,
          rsvpId: riderRsvpId,
        });
      }
    }

    return {
      carpoolsCreated: assignments.length,
      ridersAssigned: riders.length - unassignedCount,
      ridersUnassigned: unassignedCount,
    };
  },
});

export const getCarpools = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    const carpools = await ctx.db
      .query("carpools")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    const carpoolDetails = await Promise.all(
      carpools.map(async (carpool) => {
        const driverRsvp = await ctx.db.get(carpool.driverRsvpId);
        const driverProfile = driverRsvp
          ? await ctx.db.get(driverRsvp.userProfileId)
          : null;

        const members = await ctx.db
          .query("carpoolMembers")
          .withIndex("by_carpool", (q) => q.eq("carpoolId", carpool._id))
          .collect();

        const allRiderDetails = await Promise.all(
          members.map(async (member) => {
            const rsvp = await ctx.db.get(member.rsvpId);
            const profile = rsvp ? await ctx.db.get(rsvp.userProfileId) : null;
            return {
              rsvpId: member.rsvpId,
              userProfileId: rsvp?.userProfileId,
              createdAt: rsvp?.createdAt ?? 0,
              name: profile?.name ?? "Unknown",
              email: profile?.email ?? "",
              phoneNumber: profile?.phoneNumber,
            };
          })
        );

        const ridersByUser = new Map<
          string,
          {
            rsvpId: string;
            name: string;
            email: string;
            phoneNumber?: string;
            createdAt: number;
          }
        >();
        for (const rider of allRiderDetails) {
          if (!rider.userProfileId) {
            continue;
          }
          const existing = ridersByUser.get(rider.userProfileId);
          if (!existing || rider.createdAt > existing.createdAt) {
            ridersByUser.set(rider.userProfileId, {
              rsvpId: rider.rsvpId,
              name: rider.name,
              email: rider.email,
              phoneNumber: rider.phoneNumber,
              createdAt: rider.createdAt,
            });
          }
        }

        const riderDetails = Array.from(ridersByUser.values()).map((rider) => ({
          rsvpId: rider.rsvpId,
          name: rider.name,
          email: rider.email,
          phoneNumber: rider.phoneNumber,
        }));

        return {
          carpoolId: carpool._id,
          status: carpool.status,
          driver: {
            rsvpId: carpool.driverRsvpId,
            name: driverProfile?.name ?? "Unknown",
            email: driverProfile?.email ?? "",
            phoneNumber: driverProfile?.phoneNumber,
            carType: driverRsvp?.driverInfo?.carType ?? "",
            carColor: driverRsvp?.driverInfo?.carColor ?? "",
            capacity: driverRsvp?.driverInfo?.capacity ?? 0,
          },
          riders: riderDetails,
        };
      })
    );

    return carpoolDetails;
  },
});

export const updateCarpoolAssignment = mutation({
  args: {
    carpoolId: v.id("carpools"),
    addRsvpIds: v.optional(v.array(v.id("rsvps"))),
    removeRsvpIds: v.optional(v.array(v.id("rsvps"))),
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

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can update carpool assignments");
    }

    if (args.removeRsvpIds) {
      for (const rsvpId of args.removeRsvpIds) {
        const member = await ctx.db
          .query("carpoolMembers")
          .withIndex("by_rsvp", (q) => q.eq("rsvpId", rsvpId))
          .first();

        if (member && member.carpoolId === args.carpoolId) {
          await ctx.db.delete(member._id);
        }
      }
    }

    if (args.addRsvpIds) {
      for (const rsvpId of args.addRsvpIds) {
        const existingMember = await ctx.db
          .query("carpoolMembers")
          .withIndex("by_rsvp", (q) => q.eq("rsvpId", rsvpId))
          .first();

        if (existingMember) {
          await ctx.db.delete(existingMember._id);
        }

        await ctx.db.insert("carpoolMembers", {
          carpoolId: args.carpoolId,
          rsvpId,
        });
      }
    }
  },
});

export const reassignRider = mutation({
  args: {
    eventId: v.id("events"),
    riderRsvpId: v.id("rsvps"),
    fromCarpoolId: v.optional(v.id("carpools")),
    toCarpoolId: v.optional(v.id("carpools")),
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

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can reassign riders");
    }

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    if (args.toCarpoolId) {
      const toCarpool = await ctx.db.get(args.toCarpoolId);
      if (!toCarpool) {
        throw new Error("Target carpool not found");
      }

      if (toCarpool.eventId !== args.eventId) {
        throw new Error("Target carpool does not belong to this event");
      }

      if (toCarpool.status !== "draft") {
        throw new Error("Cannot reassign riders to finalized carpools");
      }

      const driverRsvp = await ctx.db.get(toCarpool.driverRsvpId);
      const capacity = driverRsvp?.driverInfo?.capacity ?? 0;

      const existingMembers = await ctx.db
        .query("carpoolMembers")
        .withIndex("by_carpool", (q) => q.eq("carpoolId", toCarpool._id))
        .collect();

      if (existingMembers.length >= capacity) {
        throw new Error("Target carpool is at capacity");
      }
    }

    const existingMember = await ctx.db
      .query("carpoolMembers")
      .withIndex("by_rsvp", (q) => q.eq("rsvpId", args.riderRsvpId))
      .first();

    if (existingMember) {
      const fromCarpool = await ctx.db.get(existingMember.carpoolId);
      if (fromCarpool && fromCarpool.status !== "draft") {
        throw new Error("Cannot reassign riders from finalized carpools");
      }
      await ctx.db.delete(existingMember._id);
    }

    if (args.toCarpoolId) {
      await ctx.db.insert("carpoolMembers", {
        carpoolId: args.toCarpoolId,
        rsvpId: args.riderRsvpId,
      });
    }

    return {
      success: true,
      riderRsvpId: args.riderRsvpId,
      fromCarpoolId: existingMember?.carpoolId,
      toCarpoolId: args.toCarpoolId,
    };
  },
});

export const finalizeCarpools = mutation({
  args: {
    eventId: v.id("events"),
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

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can finalize carpools");
    }

    const carpools = await ctx.db
      .query("carpools")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();

    for (const carpool of carpools) {
      await ctx.db.patch(carpool._id, { status: "finalized" });
    }

    return { carpoolsFinalized: carpools.length };
  },
});

/**
 * Backfill migration to add slugs to existing events that don't have them.
 * This should be run once after deploying the optional slug schema change.
 * Run this from the Convex dashboard or via a temporary admin page.
 */
export const backfillEventSlugs = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const userProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!userProfile || userProfile.role !== "board") {
      throw new Error("Only board members can run migrations");
    }

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
