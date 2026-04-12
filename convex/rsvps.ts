import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { getCurrentUserProfile, requireAuth } from "./lib/auth";

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

function buildRsvpTransportPatch(args: {
  canDrive: boolean;
  campusLocation?: "onCampus" | "offCampus";
  driverInfo?: { carType: string; carColor: string; capacity: number };
  needsRide: boolean;
  selfTransport: boolean;
}) {
  return {
    needsRide: args.needsRide,
    canDrive: args.canDrive,
    selfTransport: args.selfTransport,
    campusLocation: args.campusLocation,
    driverInfo: args.driverInfo,
  };
}

async function validateShiftCapacity(
  ctx: MutationCtx,
  eventId: Id<"events">,
  shiftId: Id<"shifts">
) {
  const shift = await ctx.db.get(shiftId);
  if (!shift || shift.eventId !== eventId) {
    throw new Error("Invalid shift for this event");
  }

  const existingShiftRsvps = await ctx.db
    .query("rsvps")
    .withIndex("by_shift", (q) => q.eq("shiftId", shiftId))
    .collect();

  if (existingShiftRsvps.length >= shift.requiredPeople) {
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
    campusLocation: v.optional(
      v.union(v.literal("onCampus"), v.literal("offCampus"))
    ),
    driverInfo: v.optional(
      v.object({
        carType: v.string(),
        carColor: v.string(),
        capacity: v.number(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userProfile = await requireAuth(ctx);

    const event = await ctx.db.get(args.eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    validateTransportOptions(args);

    const requiresCampusLocation =
      event.isOffsite && (args.needsRide || args.canDrive);
    if (requiresCampusLocation && !args.campusLocation) {
      throw new Error("Please tell us whether you're on or off campus");
    }

    const rsvpCampusLocation = requiresCampusLocation
      ? args.campusLocation
      : undefined;
    const transportPatch = buildRsvpTransportPatch({
      needsRide: args.needsRide,
      canDrive: args.canDrive,
      selfTransport: args.selfTransport,
      campusLocation: rsvpCampusLocation,
      driverInfo: args.driverInfo,
    });

    const existingRsvps = await ctx.db
      .query("rsvps")
      .withIndex("by_event_and_user", (q) =>
        q.eq("eventId", args.eventId).eq("userProfileId", userProfile._id)
      )
      .collect();

    if (event.eventType === "regular") {
      if (args.shiftId) {
        throw new Error("Regular events do not support shift RSVPs");
      }

      if (existingRsvps.length > 0) {
        for (const existingRsvp of existingRsvps) {
          await ctx.db.patch(existingRsvp._id, transportPatch);
        }
        return;
      }

      await ctx.db.insert("rsvps", {
        eventId: args.eventId,
        userProfileId: userProfile._id,
        shiftId: undefined,
        ...transportPatch,
        createdAt: Date.now(),
      });
      return;
    }

    if (!args.shiftId) {
      throw new Error("Please select a shift");
    }

    const existingShiftRsvp = existingRsvps.find(
      (existingRsvp) => existingRsvp.shiftId === args.shiftId
    );

    if (existingRsvps.length > 0) {
      for (const existingRsvp of existingRsvps) {
        await ctx.db.patch(existingRsvp._id, transportPatch);
      }
    }

    if (existingShiftRsvp) {
      return;
    }

    await validateShiftCapacity(ctx, args.eventId, args.shiftId);

    await ctx.db.insert("rsvps", {
      eventId: args.eventId,
      userProfileId: userProfile._id,
      shiftId: args.shiftId,
      ...transportPatch,
      createdAt: Date.now(),
    });
  },
});

export const deleteRsvp = mutation({
  args: {
    rsvpId: v.id("rsvps"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userProfile = await requireAuth(ctx);

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
  returns: v.array(
    v.object({
      _id: v.id("rsvps"),
      _creationTime: v.number(),
      eventId: v.id("events"),
      userProfileId: v.id("userProfiles"),
      shiftId: v.optional(v.id("shifts")),
      needsRide: v.boolean(),
      canDrive: v.boolean(),
      selfTransport: v.optional(v.boolean()),
      campusLocation: v.optional(
        v.union(v.literal("onCampus"), v.literal("offCampus"))
      ),
      driverInfo: v.optional(
        v.object({
          carType: v.string(),
          carColor: v.string(),
          capacity: v.number(),
        })
      ),
      createdAt: v.number(),
      event: v.union(
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
        }),
        v.null()
      ),
      shift: v.union(
        v.object({
          _id: v.id("shifts"),
          _creationTime: v.number(),
          eventId: v.id("events"),
          startTime: v.number(),
          endTime: v.number(),
          requiredPeople: v.number(),
        }),
        v.null()
      ),
    })
  ),
  handler: async (ctx) => {
    const userProfile = await getCurrentUserProfile(ctx);
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
